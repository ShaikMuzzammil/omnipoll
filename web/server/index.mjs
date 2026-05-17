import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "omnipoll.json");
const PORT = Number(process.env.PORT || 8787);

const app = express();
const httpServer = http.createServer(app);
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:8080,http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

const emptyDb = () => ({ users: [], polls: [] });
const voteRateLimit = new Map();

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

async function readDb() {
  ensureDataDir();
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    const db = emptyDb();
    await writeDb(db);
    return db;
  }
}

async function writeDb(db) {
  ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

async function mutateDb(mutator) {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}

function id(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: "email",
    createdAt: user.createdAt,
  };
}

function cleanCode(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function generateJoinCode(existingCodes) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = "";
    for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
    if (!existingCodes.has(code)) return code;
  }
  return crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
}

function findPoll(db, idOrCode) {
  const key = cleanCode(idOrCode);
  return db.polls.find((poll) => poll.id === idOrCode || cleanCode(poll.code) === key);
}

function normalizeStatus(status) {
  if (status === "pause" || status === "paused") return "paused";
  if (status === "resume" || status === "open" || status === "live") return "live";
  if (status === "close" || status === "closed" || status === "ended") return "closed";
  if (status === "draft") return "draft";
  return "live";
}

function getParticipantId(req) {
  return String(req.body?.participantId || req.headers["x-participant-id"] || req.ip || "anonymous");
}

function assertVoteRate(req, pollId) {
  const key = `${req.ip}:${pollId}`;
  const now = Date.now();
  const bucket = voteRateLimit.get(key) || [];
  const recent = bucket.filter((time) => now - time < 60_000);
  if (recent.length >= 5) return false;
  recent.push(now);
  voteRateLimit.set(key, recent);
  return true;
}

function checkPollWritable(poll) {
  if (!poll) return { ok: false, status: 404, message: "Poll not found." };
  if (poll.expiresAt && new Date(poll.expiresAt).getTime() < Date.now()) {
    poll.status = "closed";
    return { ok: false, status: 409, message: "Poll has closed." };
  }
  if (poll.status !== "live") return { ok: false, status: 409, message: `Poll is ${poll.status}.` };
  return { ok: true };
}

const positiveWords = new Set(["good", "great", "awesome", "excellent", "love", "clear", "helpful", "fast", "happy", "useful", "amazing", "smooth"]);
const negativeWords = new Set(["bad", "slow", "confusing", "hard", "bug", "broken", "poor", "hate", "angry", "issue", "problem", "expensive"]);
const stopWords = new Set(["the", "and", "for", "with", "this", "that", "from", "are", "our", "can", "you", "please", "would", "should", "what", "when"]);
const synonymThemes = [
  { label: "Usability", terms: ["ui", "ux", "interface", "design", "flow", "easy", "simple", "confusing"] },
  { label: "Performance", terms: ["speed", "fast", "slow", "latency", "load", "reliable", "stable"] },
  { label: "Support", terms: ["support", "help", "docs", "documentation", "guide", "onboarding"] },
  { label: "Pricing", terms: ["cost", "price", "pricing", "expensive", "budget", "plan"] },
  { label: "Product", terms: ["feature", "roadmap", "product", "release", "mobile", "api"] },
  { label: "Positive", terms: ["good", "great", "awesome", "excellent", "love", "amazing"] },
];

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word && word.length > 1 && !stopWords.has(word));
}

function analyzeSentiment(texts) {
  let positive = 0;
  let negative = 0;
  for (const text of texts) {
    for (const word of tokenize(text)) {
      if (positiveWords.has(word)) positive += 1;
      if (negativeWords.has(word)) negative += 1;
    }
  }
  const total = positive + negative;
  const neutral = Math.max(0, texts.length - total);
  return {
    positive,
    neutral,
    negative,
    score: total === 0 ? 50 : Math.round((positive / total) * 100),
    label: positive > negative ? "positive" : negative > positive ? "negative" : "neutral",
  };
}

function buildThemes(texts) {
  const buckets = new Map();
  for (const text of texts) {
    const words = tokenize(text);
    for (const theme of synonymThemes) {
      if (words.some((word) => theme.terms.includes(word))) {
        const existing = buckets.get(theme.label) || { label: theme.label, count: 0, examples: [] };
        existing.count += 1;
        if (existing.examples.length < 3) existing.examples.push(text);
        buckets.set(theme.label, existing);
      }
    }
  }
  return Array.from(buckets.values()).sort((a, b) => b.count - a.count);
}

function buildWordFrequency(texts) {
  const frequency = {};
  for (const text of texts) {
    for (const word of tokenize(text)) frequency[word] = (frequency[word] || 0) + 1;
  }
  return Object.entries(frequency)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);
}

function buildResults(poll) {
  const responses = poll.responses || [];
  const participants = new Set(responses.map((response) => response.participantId)).size;
  const base = {
    pollId: poll.id,
    code: poll.code,
    type: poll.type,
    status: poll.status,
    totalResponses: responses.length,
    participants,
    updatedAt: new Date().toISOString(),
  };

  if (poll.type === "multiple_choice") {
    const totalVotes = (poll.options || []).reduce((sum, option) => sum + (option.votes || 0), 0);
    return {
      ...base,
      totalVotes,
      options: (poll.options || []).map((option) => ({
        id: option.id,
        text: option.text,
        votes: option.votes || 0,
        pct: totalVotes ? Math.round(((option.votes || 0) / totalVotes) * 1000) / 10 : 0,
      })),
    };
  }

  if (poll.type === "rating") {
    const values = responses.map((response) => Number(response.answer?.rating)).filter(Number.isFinite);
    const distribution = {};
    const min = Number(poll.settings?.ratingMin ?? 1);
    const max = Number(poll.settings?.ratingMax ?? 5);
    for (let value = min; value <= max; value += 1) distribution[value] = 0;
    for (const value of values) distribution[value] = (distribution[value] || 0) + 1;
    const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    return { ...base, average, distribution, values };
  }

  if (poll.type === "word_cloud") {
    const texts = responses.map((response) => String(response.answer?.text || "")).filter(Boolean);
    return {
      ...base,
      words: buildWordFrequency(texts),
      responses: texts.map((text, index) => ({ id: responses[index]?.id, text })),
      sentiment: analyzeSentiment(texts),
      themes: buildThemes(texts),
    };
  }

  if (poll.type === "qa") {
    const questions = [...(poll.qnaQuestions || [])].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    const texts = questions.map((question) => question.questionText);
    return {
      ...base,
      questions: questions.map(({ voters, ...question }) => question),
      sentiment: analyzeSentiment(texts),
      themes: buildThemes(texts),
    };
  }

  if (poll.type === "quiz") {
    const submissions = poll.quizSubmissions || [];
    const players = new Map();
    for (const submission of submissions) {
      const player = players.get(submission.participantId) || {
        participantId: submission.participantId,
        name: submission.participantName || "Participant",
        score: 0,
        correct: 0,
        answered: 0,
      };
      player.score += submission.score || 0;
      player.correct += submission.isCorrect ? 1 : 0;
      player.answered += 1;
      players.set(submission.participantId, player);
    }
    return {
      ...base,
      questions: poll.quizQuestions || [],
      submissions,
      leaderboard: Array.from(players.values()).sort((a, b) => b.score - a.score),
    };
  }

  return base;
}

function emitPoll(ioServer, poll, eventName = "pollUpdated") {
  const results = buildResults(poll);
  ioServer.to(`poll:${poll.id}`).emit(eventName, { poll, results });
  ioServer.to(`poll:${poll.id}`).emit("pollUpdated", { poll, results });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "omnipoll-api" });
});

app.post("/api/auth/signup", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  if (!name || !email || !email.includes("@") || password.length < 6) {
    res.status(400).json({ message: "Name, valid email, and 6+ character password are required." });
    return;
  }

  const result = await mutateDb((db) => {
    if (db.users.some((user) => user.email === email)) return { error: "An account with this email already exists." };
    const user = {
      id: id("user"),
      name,
      email,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return { user: publicUser(user) };
  });

  if (result.error) res.status(409).json({ message: result.error });
  else res.status(201).json(result);
});

app.post("/api/auth/login", async (req, res) => {
  const identifier = String(req.body.email || req.body.identifier || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const db = await readDb();
  const user = db.users.find((candidate) => candidate.email === identifier || candidate.name.toLowerCase() === identifier);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ message: "Invalid name/email or password." });
    return;
  }
  res.json({ user: publicUser(user) });
});

app.get("/api/polls", async (req, res) => {
  const db = await readDb();
  const creatorId = String(req.query.creatorId || "");
  const polls = db.polls
    .filter((poll) => !creatorId || poll.creatorId === creatorId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ polls });
});

app.post("/api/polls", async (req, res) => {
  const title = String(req.body.title || req.body.question || "").trim();
  const question = String(req.body.question || req.body.title || "").trim();
  const type = String(req.body.type || "multiple_choice");
  const allowedTypes = new Set(["multiple_choice", "word_cloud", "qa", "quiz", "rating"]);
  if (!title || !allowedTypes.has(type)) {
    res.status(400).json({ message: "A title/question and valid poll type are required." });
    return;
  }

  const poll = await mutateDb((db) => {
    const existingCodes = new Set(db.polls.map((item) => cleanCode(item.code)));
    const code = cleanCode(req.body.code) || generateJoinCode(existingCodes);
    const options = Array.isArray(req.body.options)
      ? req.body.options
          .map((option, index) => ({
            id: option.id || id("opt"),
            text: String(option.text || option.optionText || "").trim(),
            order: index,
            votes: Number(option.votes || 0),
          }))
          .filter((option) => option.text)
      : [];
    const quizQuestions = Array.isArray(req.body.quizQuestions)
      ? req.body.quizQuestions
          .map((questionItem, index) => ({
            id: questionItem.id || id("quizq"),
            pollId: "",
            questionText: String(questionItem.questionText || "").trim(),
            options: Array.isArray(questionItem.options) ? questionItem.options.filter(Boolean) : [],
            correctAnswer: String(questionItem.correctAnswer || "").trim(),
            points: Number(questionItem.points || 10),
            timeLimit: Number(questionItem.timeLimit || 30),
            order: index,
          }))
          .filter((questionItem) => questionItem.questionText)
      : [];
    const newPoll = {
      id: id("poll"),
      creatorId: req.body.creatorId || "anonymous",
      title,
      question,
      description: String(req.body.description || ""),
      category: String(req.body.category || "General"),
      type,
      status: normalizeStatus(req.body.status || "live"),
      code,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: req.body.expiresAt || null,
      settings: req.body.settings || {},
      options,
      responses: [],
      qnaQuestions: [],
      quizQuestions,
      quizSubmissions: [],
    };
    newPoll.quizQuestions = newPoll.quizQuestions.map((questionItem) => ({ ...questionItem, pollId: newPoll.id }));
    db.polls.push(newPoll);
    return newPoll;
  });

  res.status(201).json({ poll, results: buildResults(poll) });
});

app.get("/api/polls/code/:code", async (req, res) => {
  const db = await readDb();
  const poll = findPoll(db, req.params.code);
  if (!poll) {
    res.status(404).json({ message: "Poll not found." });
    return;
  }
  res.json({ poll, results: buildResults(poll) });
});

app.get("/api/polls/:id", async (req, res) => {
  const db = await readDb();
  const poll = findPoll(db, req.params.id);
  if (!poll) {
    res.status(404).json({ message: "Poll not found." });
    return;
  }
  res.json({ poll, results: buildResults(poll) });
});

app.get("/api/polls/:id/results", async (req, res) => {
  const db = await readDb();
  const poll = findPoll(db, req.params.id);
  if (!poll) {
    res.status(404).json({ message: "Poll not found." });
    return;
  }
  res.json({ results: buildResults(poll), poll });
});

app.post("/api/polls/:id/vote", async (req, res) => {
  const participantId = getParticipantId(req);
  let updatedPoll;
  const result = await mutateDb((db) => {
    const poll = findPoll(db, req.params.id);
    const writable = checkPollWritable(poll);
    if (!writable.ok) return { status: writable.status, message: writable.message };
    if (!assertVoteRate(req, poll.id)) return { status: 429, message: "Too many votes. Try again in a minute." };

    const restrictOne = poll.settings?.restrictOnePerDevice !== false;
    if (restrictOne && ["multiple_choice", "rating"].includes(poll.type)) {
      const alreadyVoted = (poll.responses || []).some((response) => response.participantId === participantId);
      if (alreadyVoted) return { status: 409, message: "This device has already voted in this poll." };
    }

    const response = {
      id: id("response"),
      pollId: poll.id,
      participantId,
      answer: req.body.answer || {},
      createdAt: new Date().toISOString(),
    };

    if (poll.type === "multiple_choice") {
      const selectedIds = Array.isArray(req.body.answer?.optionIds)
        ? req.body.answer.optionIds
        : [req.body.answer?.optionId].filter(Boolean);
      if (!selectedIds.length) return { status: 400, message: "Select at least one option." };
      const valid = new Set((poll.options || []).map((option) => option.id));
      for (const optionId of selectedIds) if (!valid.has(optionId)) return { status: 400, message: "Invalid option selected." };
      response.answer = { optionIds: selectedIds };
      poll.options = poll.options.map((option) =>
        selectedIds.includes(option.id) ? { ...option, votes: (option.votes || 0) + 1 } : option,
      );
    }

    if (poll.type === "rating") {
      const rating = Number(req.body.answer?.rating);
      const min = Number(poll.settings?.ratingMin ?? 1);
      const max = Number(poll.settings?.ratingMax ?? 5);
      if (!Number.isFinite(rating) || rating < min || rating > max) return { status: 400, message: "Rating is outside the allowed scale." };
      response.answer = { rating };
    }

    if (poll.type === "word_cloud") {
      const text = String(req.body.answer?.text || "").trim();
      if (!text) return { status: 400, message: "Enter a word or phrase." };
      response.answer = { text: text.slice(0, 120) };
    }

    poll.responses = [response, ...(poll.responses || [])];
    poll.updatedAt = new Date().toISOString();
    updatedPoll = poll;
    return { status: 200, poll, results: buildResults(poll) };
  });

  if (result.status && result.status !== 200) {
    res.status(result.status).json({ message: result.message });
    return;
  }
  emitPoll(io, updatedPoll, updatedPoll.type === "word_cloud" ? "wordCloudUpdate" : "voteUpdate");
  res.json(result);
});

app.post("/api/polls/:id/qa", async (req, res) => {
  const participantId = getParticipantId(req);
  let updatedPoll;
  const result = await mutateDb((db) => {
    const poll = findPoll(db, req.params.id);
    const writable = checkPollWritable(poll);
    if (!writable.ok) return { status: writable.status, message: writable.message };
    const questionText = String(req.body.questionText || "").trim();
    if (!questionText) return { status: 400, message: "Question cannot be empty." };
    const question = {
      id: id("qa"),
      pollId: poll.id,
      participantId,
      questionText: questionText.slice(0, 280),
      upvotes: 0,
      voters: [],
      status: "active",
      createdAt: new Date().toISOString(),
    };
    poll.qnaQuestions = [question, ...(poll.qnaQuestions || [])];
    poll.updatedAt = new Date().toISOString();
    updatedPoll = poll;
    return { status: 201, question, poll, results: buildResults(poll) };
  });
  if (result.status && result.status !== 201) {
    res.status(result.status).json({ message: result.message });
    return;
  }
  emitPoll(io, updatedPoll, "qaUpdate");
  res.status(201).json(result);
});

app.put("/api/polls/:id/qa/:questionId/upvote", async (req, res) => {
  const participantId = getParticipantId(req);
  let updatedPoll;
  const result = await mutateDb((db) => {
    const poll = findPoll(db, req.params.id);
    const writable = checkPollWritable(poll);
    if (!writable.ok) return { status: writable.status, message: writable.message };
    const question = (poll.qnaQuestions || []).find((item) => item.id === req.params.questionId);
    if (!question) return { status: 404, message: "Question not found." };
    question.voters = question.voters || [];
    if (question.voters.includes(participantId)) return { status: 409, message: "Already upvoted." };
    question.voters.push(participantId);
    question.upvotes = (question.upvotes || 0) + 1;
    poll.updatedAt = new Date().toISOString();
    updatedPoll = poll;
    return { status: 200, question, poll, results: buildResults(poll) };
  });
  if (result.status && result.status !== 200) {
    res.status(result.status).json({ message: result.message });
    return;
  }
  emitPoll(io, updatedPoll, "qaUpdate");
  res.json(result);
});

app.post("/api/polls/:id/quiz/submit", async (req, res) => {
  const participantId = getParticipantId(req);
  let updatedPoll;
  const result = await mutateDb((db) => {
    const poll = findPoll(db, req.params.id);
    const writable = checkPollWritable(poll);
    if (!writable.ok) return { status: writable.status, message: writable.message };
    const question = (poll.quizQuestions || []).find((item) => item.id === req.body.questionId);
    if (!question) return { status: 404, message: "Quiz question not found." };
    const previous = (poll.quizSubmissions || []).find(
      (submission) => submission.participantId === participantId && submission.questionId === question.id,
    );
    if (previous) return { status: 409, message: "Question already answered." };
    const selectedAnswer = String(req.body.selectedAnswer || "").trim();
    const isCorrect = selectedAnswer.toLowerCase() === String(question.correctAnswer || "").trim().toLowerCase();
    const submission = {
      id: id("quizsub"),
      participantId,
      participantName: String(req.body.participantName || "Participant").slice(0, 40),
      quizPollId: poll.id,
      questionId: question.id,
      selectedAnswer,
      isCorrect,
      score: isCorrect ? Number(question.points || 10) : 0,
      createdAt: new Date().toISOString(),
    };
    poll.quizSubmissions = [submission, ...(poll.quizSubmissions || [])];
    poll.updatedAt = new Date().toISOString();
    updatedPoll = poll;
    return { status: 200, submission, poll, results: buildResults(poll) };
  });
  if (result.status && result.status !== 200) {
    res.status(result.status).json({ message: result.message });
    return;
  }
  emitPoll(io, updatedPoll, "leaderboardUpdate");
  res.json(result);
});

app.get("/api/polls/:id/quiz/leaderboard", async (req, res) => {
  const db = await readDb();
  const poll = findPoll(db, req.params.id);
  if (!poll) {
    res.status(404).json({ message: "Poll not found." });
    return;
  }
  res.json({ leaderboard: buildResults(poll).leaderboard || [] });
});

app.patch("/api/polls/:id/status", async (req, res) => {
  let updatedPoll;
  const result = await mutateDb((db) => {
    const poll = findPoll(db, req.params.id);
    if (!poll) return { status: 404, message: "Poll not found." };
    poll.status = normalizeStatus(req.body.status);
    poll.updatedAt = new Date().toISOString();
    updatedPoll = poll;
    return { status: 200, poll, results: buildResults(poll) };
  });
  if (result.status && result.status !== 200) {
    res.status(result.status).json({ message: result.message });
    return;
  }
  emitPoll(io, updatedPoll, "statusUpdate");
  res.json(result);
});

app.delete("/api/polls/:id", async (req, res) => {
  const result = await mutateDb((db) => {
    const before = db.polls.length;
    db.polls = db.polls.filter((poll) => poll.id !== req.params.id);
    return { deleted: before !== db.polls.length };
  });
  if (!result.deleted) {
    res.status(404).json({ message: "Poll not found." });
    return;
  }
  res.json({ ok: true });
});

app.get("/api/polls/:id/export/csv", async (req, res) => {
  const db = await readDb();
  const poll = findPoll(db, req.params.id);
  if (!poll) {
    res.status(404).send("Poll not found.");
    return;
  }
  const rows = [["poll_id", "poll_title", "poll_type", "response_id", "participant_id", "answer", "created_at"]];
  for (const response of poll.responses || []) rows.push([poll.id, poll.title, poll.type, response.id, response.participantId, JSON.stringify(response.answer), response.createdAt]);
  for (const question of poll.qnaQuestions || []) rows.push([poll.id, poll.title, poll.type, question.id, question.participantId, question.questionText, question.createdAt]);
  for (const submission of poll.quizSubmissions || []) rows.push([poll.id, poll.title, poll.type, submission.id, submission.participantId, JSON.stringify(submission), submission.createdAt]);
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${poll.code}-results.csv"`);
  res.send(csv);
});

io.on("connection", (socket) => {
  socket.on("joinPoll", async ({ pollId, code }) => {
    const db = await readDb();
    const poll = findPoll(db, pollId || code);
    if (!poll) {
      socket.emit("pollError", { message: "Poll not found." });
      return;
    }
    socket.join(`poll:${poll.id}`);
    socket.emit("pollUpdated", { poll, results: buildResults(poll) });
  });

  socket.on("leavePoll", ({ pollId }) => {
    if (pollId) socket.leave(`poll:${pollId}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`OmniPoll API and Socket.IO server running on http://localhost:${PORT}`);
});
