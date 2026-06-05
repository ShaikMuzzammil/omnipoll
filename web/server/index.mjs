import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import cors from "cors";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET","POST","PATCH","PUT","DELETE"] }
});

app.use(cors());
app.use(express.json());

// ── In-memory store ─────────────────────────────────────────────
const polls = new Map();
const users = new Map();
const activeSessions = new Map(); // pollId → Set of socketIds
const participantNames = new Map(); // socketId → name

// ── Helpers ─────────────────────────────────────────────────────
function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function ensureCode() {
  let code;
  do { code = genCode(); } while ([...polls.values()].some(p => p.code === code));
  return code;
}

function aggregateResults(poll) {
  const r = {
    participants: poll.participants?.length || 0,
    totalVotes: poll.responses.length,
  };
  const type = poll.type;

  if (type === "multiple_choice" || type === "image_choice" || type === "true_false") {
    const counts = {};
    poll.options.forEach(o => { counts[o.id] = 0; });
    poll.responses.forEach(r => { if (counts[r.answer] !== undefined) counts[r.answer]++; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    r.options = poll.options.map(o => ({
      ...o, votes: counts[o.id] || 0,
      pct: total ? Math.round(((counts[o.id] || 0) / total) * 100) : 0
    }));
  }

  if (type === "word_cloud" || type === "open_text") {
    const freq = {};
    poll.responses.forEach(resp => {
      const text = String(resp.answer || "").trim().toLowerCase();
      if (!text) return;
      if (type === "word_cloud") {
        text.split(/\s+/).filter(w => w.length > 2).forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      } else {
        freq[text] = (freq[text] || 0) + 1;
      }
    });
    r.words = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 60).map(([text, count]) => ({ text, count }));
    r.submissions = poll.responses.map(rr => ({ answer: rr.answer, createdAt: rr.createdAt }));
  }

  if (type === "qa") {
    r.questions = [...(poll.qaQuestions || [])].sort((a, b) => b.upvotes - a.upvotes);
  }

  if (type === "quiz") {
    r.leaderboard = [...(poll.quizSubmissions || [])].sort((a, b) => b.score - a.score).slice(0, 20)
      .map(s => ({ participantId: s.participantId, name: s.participantName || "Anonymous", score: s.score, correct: s.correct || 0, answered: s.answered || 0 }));
  }

  if (type === "rating" || type === "nps") {
    const nums = poll.responses.map(r => Number(r.answer)).filter(n => !isNaN(n));
    r.average = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;
    const dist = {};
    nums.forEach(n => { dist[n] = (dist[n] || 0) + 1; });
    r.distribution = dist;
    if (type === "nps") {
      const detractors = nums.filter(n => n <= 6).length;
      const passives = nums.filter(n => n === 7 || n === 8).length;
      const promoters = nums.filter(n => n >= 9).length;
      const total = nums.length || 1;
      r.detractors = detractors; r.passives = passives; r.promoters = promoters;
      r.npsScore = Math.round(((promoters - detractors) / total) * 100);
    }
  }

  if (type === "slider") {
    const nums = poll.responses.map(r => Number(r.answer)).filter(n => !isNaN(n));
    r.average = nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;
    r.distribution = {};
    nums.forEach(n => { const bucket = Math.round(n / 10) * 10; r.distribution[bucket] = (r.distribution[bucket] || 0) + 1; });
  }

  if (type === "ranking") {
    const pointMap = {};
    poll.options.forEach(o => { pointMap[o.id] = 0; });
    poll.responses.forEach(resp => {
      const ranked = Array.isArray(resp.answer) ? resp.answer : [];
      ranked.forEach((id, idx) => { if (pointMap[id] !== undefined) pointMap[id] += (poll.options.length - idx); });
    });
    r.rankingResults = poll.options.map(o => ({
      id: o.id, text: o.text,
      points: pointMap[o.id] || 0,
      avgRank: poll.responses.length ? (pointMap[o.id] / poll.responses.length) : 0
    })).sort((a, b) => b.points - a.points);
  }

  if (type === "matrix") {
    const matrixResults = {};
    (poll.settings?.matrixRows || []).forEach(row => {
      matrixResults[row.id] = {};
      (poll.settings?.matrixColumns || []).forEach(col => { matrixResults[row.id][col.id] = 0; });
    });
    poll.responses.forEach(resp => {
      const answers = resp.answer || {};
      Object.entries(answers).forEach(([rowId, colId]) => {
        if (matrixResults[rowId] && matrixResults[rowId][colId] !== undefined)
          matrixResults[rowId][colId]++;
      });
    });
    r.matrixResults = matrixResults;
  }

  if (type === "emoji_reaction") {
    const counts = {};
    poll.responses.forEach(resp => { const e = String(resp.answer); counts[e] = (counts[e] || 0) + 1; });
    r.emojiCounts = counts;
  }

  if (type === "heatmap") {
    r.heatmapPoints = poll.responses.map(resp => resp.answer).filter(Boolean);
  }

  if (type === "prioritization") {
    const totals = {};
    poll.options.forEach(o => { totals[o.id] = 0; });
    poll.responses.forEach(resp => {
      const allocation = resp.answer || {};
      Object.entries(allocation).forEach(([id, pts]) => { if (totals[id] !== undefined) totals[id] += Number(pts); });
    });
    r.options = poll.options.map(o => ({
      ...o, votes: totals[o.id] || 0,
      pct: poll.responses.length ? Math.round((totals[o.id] / poll.responses.length)) : 0
    })).sort((a, b) => b.votes - a.votes);
  }

  if (type === "fill_blank") {
    r.answers = poll.responses.map(resp => String(resp.answer || "")).filter(Boolean);
  }

  if (type === "bracket") {
    const counts = {};
    poll.options.forEach(o => { counts[o.id] = 0; });
    poll.responses.forEach(resp => { if (counts[resp.answer] !== undefined) counts[resp.answer]++; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    r.bracketResults = poll.options.filter(o => !o.eliminated).map(o => ({
      ...o, votes: counts[o.id] || 0,
      pct: total ? Math.round(((counts[o.id] || 0) / total) * 100) : 0
    }));
  }

  if (type === "live_matching") {
    const pairs = poll.settings?.matchingPairs || [];
    r.matchingResults = pairs.map(pair => {
      const correct = poll.responses.filter(resp => {
        const ans = resp.answer || {};
        return ans[pair.left] === pair.right;
      }).length;
      return { left: pair.left, right: pair.right, correct, total: poll.responses.length };
    });
  }

  if (type === "countdown_vote") {
    const active = poll.options.filter(o => !o.eliminated);
    const counts = {};
    active.forEach(o => { counts[o.id] = 0; });
    poll.responses.forEach(resp => { if (counts[resp.answer] !== undefined) counts[resp.answer]++; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    r.options = active.map(o => ({
      ...o, votes: counts[o.id] || 0,
      pct: total ? Math.round(((counts[o.id] || 0) / total) * 100) : 0
    }));
  }

  return r;
}

// ── Auth ─────────────────────────────────────────────────────────
app.post("/api/auth/signup", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
  if ([...users.values()].some(u => u.email === email))
    return res.status(409).json({ error: "Email already registered" });
  const user = { id: nanoid(), name, email, password, plan: "free", createdAt: Date.now() };
  users.set(user.id, user);
  const { password: _, ...safe } = user;
  res.json({ user: safe, token: `tok_${user.id}` });
});

app.post("/api/auth/signin", (req, res) => {
  const { email, password } = req.body;
  const user = [...users.values()].find(u => u.email === email);
  if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });
  const { password: _, ...safe } = user;
  res.json({ user: safe, token: `tok_${user.id}` });
});

app.get("/api/auth/me", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token?.startsWith("tok_")) return res.status(401).json({ error: "Unauthorized" });
  const userId = token.replace("tok_", "");
  const user = users.get(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { password: _, ...safe } = user;
  res.json({ user: safe });
});

// ── Polls CRUD ───────────────────────────────────────────────────
app.get("/api/polls", (req, res) => {
  const { creatorId } = req.query;
  let list = [...polls.values()];
  if (creatorId) list = list.filter(p => p.creatorId === creatorId);
  list.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ polls: list });
});

app.post("/api/polls", (req, res) => {
  const body = req.body;
  const token = req.headers.authorization?.replace("Bearer ", "");
  const creatorId = token?.startsWith("tok_") ? token.replace("tok_", "") : nanoid();
  const poll = {
    id: nanoid(),
    code: ensureCode(),
    creatorId,
    title: body.title || body.question || "Untitled Poll",
    description: body.description || "",
    category: body.category || "general",
    type: body.type || "multiple_choice",
    question: body.question || body.title || "Untitled",
    options: body.options || [],
    quizQuestions: body.quizQuestions || [],
    settings: body.settings || {},
    responses: [],
    qaQuestions: [],
    quizSubmissions: [],
    participants: [],
    status: "live",
    createdAt: Date.now(),
    expiresAt: body.settings?.duration ? Date.now() + body.settings.duration * 60000 : null,
  };
  polls.set(poll.id, poll);
  res.status(201).json({ poll });
});

app.get("/api/polls/:id", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Poll not found" });
  res.json({ poll, results: aggregateResults(poll) });
});

app.put("/api/polls/:id", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Not found" });
  Object.assign(poll, req.body, { id: poll.id, updatedAt: Date.now() });
  res.json({ poll });
});

app.patch("/api/polls/:id/status", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Not found" });
  poll.status = req.body.status;
  io.to(req.params.id).emit("status-changed", { status: poll.status });
  res.json({ poll });
});

app.delete("/api/polls/:id", (req, res) => {
  polls.delete(req.params.id);
  res.json({ success: true });
});

app.get("/api/join", (req, res) => {
  const code = String(req.query.code || "").toUpperCase().trim();
  const poll = [...polls.values()].find(p => p.code === code);
  if (!poll) return res.status(404).json({ error: "Poll not found" });
  res.json({ poll });
});

// ── Voting ───────────────────────────────────────────────────────
app.post("/api/polls/:id/vote", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Poll not found" });
  if (poll.status === "closed") return res.status(400).json({ error: "Poll is closed" });
  const { participantId, participantName, answer, questionId } = req.body;
  if (!participantId) return res.status(400).json({ error: "participantId required" });
  if (poll.settings?.oneVote !== false) {
    const existing = poll.responses.find(r => r.participantId === participantId && (!questionId || r.questionId === questionId));
    if (existing) return res.status(409).json({ error: "Already voted" });
  }
  const response = { id: nanoid(), participantId, participantName, answer, questionId, createdAt: Date.now() };
  poll.responses.push(response);
  if (!poll.participants.includes(participantId)) {
    poll.participants.push(participantId);
    io.to(req.params.id).emit("participant-joined", { count: poll.participants.length });
  }
  const results = aggregateResults(poll);
  io.to(req.params.id).emit("results-update", results);
  res.json({ response, results });
});

// ── Q&A ──────────────────────────────────────────────────────────
app.post("/api/polls/:id/qa", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Not found" });
  const qa = { id: nanoid(), questionText: req.body.questionText, participantId: req.body.participantId, upvotes: 0, status: "open", createdAt: Date.now() };
  poll.qaQuestions.push(qa);
  io.to(req.params.id).emit("qa-update", { questions: [...poll.qaQuestions].sort((a, b) => b.upvotes - a.upvotes) });
  res.status(201).json({ question: qa });
});

app.put("/api/polls/:id/qa/:questionId/upvote", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Not found" });
  const q = poll.qaQuestions.find(q => q.id === req.params.questionId);
  if (!q) return res.status(404).json({ error: "Question not found" });
  q.upvotes++;
  io.to(req.params.id).emit("qa-update", { questions: [...poll.qaQuestions].sort((a, b) => b.upvotes - a.upvotes) });
  res.json({ question: q });
});

app.patch("/api/polls/:id/qa/:questionId/moderate", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Not found" });
  const q = poll.qaQuestions.find(q => q.id === req.params.questionId);
  if (!q) return res.status(404).json({ error: "Question not found" });
  const actionMap = { answer: "answered", highlight: "highlighted", dismiss: "dismissed" };
  q.status = actionMap[req.body.action] || q.status;
  io.to(req.params.id).emit("qa-update", { questions: [...poll.qaQuestions].sort((a, b) => b.upvotes - a.upvotes) });
  res.json({ question: q });
});

// ── Quiz ─────────────────────────────────────────────────────────
app.post("/api/polls/:id/quiz/submit", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Not found" });
  const { participantId, participantName, answers, score } = req.body;
  const sub = { participantId, participantName: participantName || "Anonymous", answers: answers || [], score: score || 0, correct: (answers || []).filter(a => a.isCorrect).length, answered: (answers || []).length, completedAt: Date.now() };
  if (!poll.quizSubmissions) poll.quizSubmissions = [];
  poll.quizSubmissions.push(sub);
  const results = aggregateResults(poll);
  io.to(req.params.id).emit("results-update", results);
  res.json({ submission: sub, leaderboard: results.leaderboard });
});

app.get("/api/polls/:id/quiz/leaderboard", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Not found" });
  res.json({ leaderboard: aggregateResults(poll).leaderboard || [] });
});

// ── Analytics ────────────────────────────────────────────────────
app.get("/api/polls/:id/results", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Not found" });
  res.json({ poll, results: aggregateResults(poll) });
});

app.get("/api/polls/:id/analytics", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Not found" });
  res.json({ poll, results: aggregateResults(poll), responsesPerMinute: [], deviceBreakdown: { desktop: 60, mobile: 35, tablet: 5 } });
});

app.get("/api/analytics/dashboard", (req, res) => {
  const { creatorId } = req.query;
  const userPolls = [...polls.values()].filter(p => p.creatorId === creatorId);
  res.json({
    totalPolls: userPolls.length,
    livePolls: userPolls.filter(p => p.status === "live").length,
    totalParticipants: userPolls.reduce((a, p) => a + p.participants.length, 0),
    totalResponses: userPolls.reduce((a, p) => a + p.responses.length, 0),
    recentActivity: userPolls.slice(0, 5).map(p => ({ id: p.id, title: p.title, type: p.type, responses: p.responses.length, createdAt: p.createdAt })),
  });
});

app.get("/api/polls/:id/export/csv", (req, res) => {
  const poll = polls.get(req.params.id);
  if (!poll) return res.status(404).json({ error: "Not found" });
  const rows = poll.responses.map(r => `${r.id},${r.participantId},${JSON.stringify(r.answer)},${r.createdAt}`);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${poll.code}-responses.csv"`);
  res.send(["id,participantId,answer,createdAt", ...rows].join("\n"));
});

// ── Health ───────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok", polls: polls.size, users: users.size }));

// ── Socket.IO ────────────────────────────────────────────────────
io.on("connection", (socket) => {
  socket.on("host-join", ({ pollId }) => {
    socket.join(pollId);
    if (!activeSessions.has(pollId)) activeSessions.set(pollId, new Set());
    activeSessions.get(pollId).add(socket.id);
    const poll = polls.get(pollId);
    if (poll) socket.emit("results-update", aggregateResults(poll));
  });

  socket.on("join-poll", ({ pollId, participantId, participantName }) => {
    socket.join(pollId);
    if (participantName) participantNames.set(socket.id, participantName);
    const poll = polls.get(pollId);
    if (poll && !poll.participants.includes(participantId)) {
      poll.participants.push(participantId);
      io.to(pollId).emit("participant-joined", { count: poll.participants.length });
    }
    if (poll) socket.emit("poll-state", { poll, results: aggregateResults(poll) });
  });

  socket.on("submit-vote", ({ pollId, participantId, participantName, answer, questionId }) => {
    const poll = polls.get(pollId);
    if (!poll || poll.status === "closed") return;
    if (poll.settings?.oneVote !== false) {
      const exists = poll.responses.find(r => r.participantId === participantId && (!questionId || r.questionId === questionId));
      if (exists) return;
    }
    poll.responses.push({ id: nanoid(), participantId, participantName, answer, questionId, createdAt: Date.now() });
    if (!poll.participants.includes(participantId)) {
      poll.participants.push(participantId);
      io.to(pollId).emit("participant-joined", { count: poll.participants.length });
    }
    const results = aggregateResults(poll);
    io.to(pollId).emit("results-update", results);
  });

  socket.on("go-live", ({ pollId }) => {
    const poll = polls.get(pollId);
    if (!poll) return;
    poll.status = "live";
    io.to(pollId).emit("status-changed", { status: "live" });
  });

  socket.on("pause-poll", ({ pollId }) => {
    const poll = polls.get(pollId);
    if (!poll) return;
    poll.status = "paused";
    io.to(pollId).emit("status-changed", { status: "paused" });
    io.to(pollId).emit("results-update", aggregateResults(poll));
  });

  socket.on("close-poll", ({ pollId }) => {
    const poll = polls.get(pollId);
    if (!poll) return;
    poll.status = "closed";
    io.to(pollId).emit("status-changed", { status: "closed" });
    io.to(pollId).emit("results-update", aggregateResults(poll));
  });

  socket.on("reveal-results", ({ pollId }) => {
    const poll = polls.get(pollId);
    if (poll) io.to(pollId).emit("results-update", aggregateResults(poll));
  });

  socket.on("submit-qa", ({ pollId, questionText, participantId }) => {
    const poll = polls.get(pollId);
    if (!poll) return;
    const qa = { id: nanoid(), questionText, participantId, upvotes: 0, status: "open", createdAt: Date.now() };
    poll.qaQuestions.push(qa);
    io.to(pollId).emit("qa-update", { questions: [...poll.qaQuestions].sort((a, b) => b.upvotes - a.upvotes) });
  });

  socket.on("upvote-qa", ({ pollId, questionId }) => {
    const poll = polls.get(pollId);
    if (!poll) return;
    const q = poll.qaQuestions.find(q => q.id === questionId);
    if (q) { q.upvotes++; io.to(pollId).emit("qa-update", { questions: [...poll.qaQuestions].sort((a, b) => b.upvotes - a.upvotes) }); }
  });

  socket.on("moderate-qa", ({ pollId, questionId, action }) => {
    const poll = polls.get(pollId);
    if (!poll) return;
    const q = poll.qaQuestions.find(q => q.id === questionId);
    if (q) {
      q.status = { answer: "answered", highlight: "highlighted", dismiss: "dismissed" }[action] || q.status;
      io.to(pollId).emit("qa-update", { questions: [...poll.qaQuestions].sort((a, b) => b.upvotes - a.upvotes) });
    }
  });

  socket.on("bracket-eliminate", ({ pollId, optionId }) => {
    const poll = polls.get(pollId);
    if (!poll) return;
    const opt = poll.options.find(o => o.id === optionId);
    if (opt) { opt.eliminated = true; poll.responses = []; io.to(pollId).emit("results-update", aggregateResults(poll)); }
  });

  socket.on("disconnect", () => {
    participantNames.delete(socket.id);
    activeSessions.forEach((sockets, pollId) => {
      sockets.delete(socket.id);
      if (sockets.size === 0) activeSessions.delete(pollId);
    });
  });
});

const PORT = process.env.PORT || 8787;
httpServer.listen(PORT, () => console.log(`🚀 OmniPoll server running on port ${PORT}`));
