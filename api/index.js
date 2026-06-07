"use strict";
const express = require("express");
const Pusher  = require("pusher");
const cors    = require("cors");
const crypto  = require("crypto");

// ── ID generator (replaces nanoid — no ESM issues) ───────────────
function uid(size = 12) {
  return crypto.randomBytes(size).toString("base64url").slice(0, size);
}
function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function ensureCode() {
  let code;
  do { code = genCode(); } while ([...polls.values()].some(p => p.code === code));
  return code;
}

// ── In-memory store ──────────────────────────────────────────────
const polls = new Map();
const users = new Map();

// ── Demo user ─────────────────────────────────────────────────────
const DEMO_ID = "demo_user_001";
users.set(DEMO_ID, {
  id: DEMO_ID, name: "Demo User", email: "demo@omnipoll.io",
  password: "demo1234", plan: "pro", createdAt: new Date().toISOString(),
});

// ── Pusher (optional — graceful fallback if not configured) ──────
let pusher = null;
try {
  if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET) {
    pusher = new Pusher({
      appId:   process.env.PUSHER_APP_ID,
      key:     process.env.PUSHER_KEY,
      secret:  process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER || "ap2",
      useTLS:  true,
    });
  }
} catch (e) { console.warn("Pusher init failed:", e.message); }

function trigger(pollId, event, data) {
  if (!pusher) return;
  pusher.trigger("poll-" + pollId, event, data).catch(e => console.warn("Pusher error:", e.message));
}

// ── Express app ───────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

// ── Aggregation ───────────────────────────────────────────────────
function aggregateResults(poll) {
  const r = { participants: (poll.participants || []).length, totalVotes: poll.responses.length };
  const { type } = poll;

  if (["multiple_choice","image_choice","true_false","bracket","countdown_vote"].includes(type)) {
    const counts = {};
    (poll.options || []).forEach(o => { counts[o.id] = 0; });
    poll.responses.forEach(res => { if (counts[res.answer] !== undefined) counts[res.answer]++; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    r.options = (poll.options || []).map(o => ({
      ...o, votes: counts[o.id] || 0,
      pct: total ? Math.round(((counts[o.id] || 0) / total) * 100) : 0
    }));
  }
  if (type === "word_cloud" || type === "open_text") {
    const freq = {};
    poll.responses.forEach(res => {
      const text = String(res.answer || "").trim().toLowerCase();
      if (!text) return;
      if (type === "word_cloud") {
        text.split(/\s+/).filter(w => w.length > 2).forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      } else { freq[text] = (freq[text] || 0) + 1; }
    });
    r.words = Object.entries(freq).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count).slice(0, 50);
  }
  if (type === "rating" || type === "nps" || type === "slider") {
    const nums = poll.responses.map(res => Number(res.answer)).filter(n => !isNaN(n));
    r.average = nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : 0;
    r.distribution = {};
    nums.forEach(n => { r.distribution[n] = (r.distribution[n] || 0) + 1; });
    if (type === "nps") {
      const promoters = nums.filter(n => n >= 9).length;
      const detractors = nums.filter(n => n <= 6).length;
      r.npsScore   = nums.length ? Math.round(((promoters - detractors) / nums.length) * 100) : 0;
      r.promoters  = promoters;
      r.passives   = nums.filter(n => n === 7 || n === 8).length;
      r.detractors = detractors;
    }
  }
  if (type === "ranking" || type === "prioritization") {
    const scores = {};
    (poll.options || []).forEach(o => { scores[o.id] = 0; });
    poll.responses.forEach(res => {
      if (Array.isArray(res.answer)) {
        res.answer.forEach((id, idx) => { if (scores[id] !== undefined) scores[id] += ((poll.options || []).length - idx); });
      }
    });
    r.rankings = (poll.options || []).map(o => ({ ...o, score: scores[o.id] || 0 })).sort((a, b) => b.score - a.score);
  }
  if (type === "matrix") {
    const matrix = {};
    (poll.matrixRows || []).forEach(row => {
      matrix[row.id] = {};
      (poll.matrixCols || []).forEach(col => { matrix[row.id][col.id] = 0; });
    });
    poll.responses.forEach(res => {
      if (res.answer && typeof res.answer === "object") {
        Object.entries(res.answer).forEach(([rowId, colId]) => {
          if (matrix[rowId] && matrix[rowId][colId] !== undefined) matrix[rowId][colId]++;
        });
      }
    });
    r.matrix = matrix; r.matrixRows = poll.matrixRows; r.matrixCols = poll.matrixCols;
  }
  if (type === "emoji_reaction") {
    const counts = {};
    (poll.options || []).forEach(o => { counts[o.id] = 0; });
    poll.responses.forEach(res => { if (counts[res.answer] !== undefined) counts[res.answer]++; });
    r.emojis = (poll.options || []).map(o => ({ ...o, count: counts[o.id] || 0 }));
  }
  if (type === "qa") r.questions = (poll.qaQuestions || []).sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
  if (type === "quiz") {
    r.leaderboard = [...(poll.participants || [])].map(p => {
      const score = (poll.responses || []).filter(res => res.participantId === p.id && res.correct)
        .reduce((acc, res) => acc + (res.points || 10), 0);
      return { name: p.name, score };
    }).sort((a, b) => b.score - a.score).slice(0, 20);
  }
  if (type === "heatmap") { r.heatPoints = poll.responses.map(res => res.answer).filter(Boolean); r.heatmapUrl = poll.heatmapUrl; }
  if (type === "fill_blank") {
    const freq = {};
    poll.responses.forEach(res => { const t = String(res.answer || "").trim().toLowerCase(); if (t) freq[t] = (freq[t] || 0) + 1; });
    r.answers = Object.entries(freq).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count);
  }
  if (type === "live_matching") {
    const counts = {};
    poll.responses.forEach(res => {
      if (res.answer && typeof res.answer === "object") {
        Object.entries(res.answer).forEach(([k, v]) => { const key = k + "→" + v; counts[key] = (counts[key] || 0) + 1; });
      }
    });
    r.matchResults = counts; r.matchingPairs = poll.matchingPairs;
  }
  return r;
}

// ══════════════════════════════════════════════════════════════════
// AUTH ROUTES
// ══════════════════════════════════════════════════════════════════
app.post("/api/auth/signup", (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });
    if ([...users.values()].find(u => u.email === email)) return res.status(400).json({ error: "Email already registered" });
    const user = { id: uid(), name, email, password, plan: "free", createdAt: new Date().toISOString() };
    users.set(user.id, user);
    const { password: _, ...safe } = user;
    return res.json({ user: safe, token: "token_" + user.id });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post("/api/auth/signin", (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = [...users.values()].find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });
    const { password: _, ...safe } = user;
    return res.json({ user: safe, token: "token_" + user.id });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get("/api/auth/me", (req, res) => {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "No token" });
    const userId = token.replace("token_", "");
    const user = users.get(userId);
    if (!user) return res.status(401).json({ error: "Invalid token" });
    const { password: _, ...safe } = user;
    return res.json({ user: safe });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════════
// POLL ROUTES
// ══════════════════════════════════════════════════════════════════
app.post("/api/polls", (req, res) => {
  try {
    const d = req.body || {};
    const poll = {
      id: uid(), code: ensureCode(),
      title: d.title || d.question || "Untitled Poll",
      question: d.question || d.title || "",
      description: d.description || "",
      type: d.type || "multiple_choice",
      status: "draft",
      options: (d.options || []).map(o => ({ id: o.id || uid(8), text: o.text || "", emoji: o.emoji || "", imageUrl: o.imageUrl || "" })),
      matrixRows: d.matrixRows || [], matrixCols: d.matrixCols || [],
      matchingPairs: d.matchingPairs || [], sentence: d.sentence || "",
      sliderMin: d.sliderMin ?? 0, sliderMax: d.sliderMax ?? 100, sliderLabel: d.sliderLabel || "",
      heatmapUrl: d.heatmapUrl || "", quizQuestions: d.quizQuestions || [],
      settings: { multiSelect: !!d.multiSelect, showResults: d.showResults !== false, oneVotePerPerson: d.oneVote !== false, duration: d.duration || null },
      creatorId: d.creatorId || "",
      responses: [], participants: [], qaQuestions: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    polls.set(poll.id, poll);
    return res.status(201).json({ poll });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get("/api/polls", (req, res) => {
  try {
    const { creatorId } = req.query;
    let list = [...polls.values()];
    if (creatorId) list = list.filter(p => p.creatorId === creatorId);
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ polls: list.map(p => ({ ...p, responses: undefined, _count: { responses: p.responses.length, participants: p.participants.length } })) });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get("/api/polls/join/:code", (req, res) => {
  try {
    const poll = [...polls.values()].find(p => p.code === req.params.code.toUpperCase());
    if (!poll) return res.status(404).json({ error: "Poll not found — check your code" });
    return res.json({ poll: { ...poll, responses: undefined } });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get("/api/polls/:id", (req, res) => {
  try {
    const poll = polls.get(req.params.id) || [...polls.values()].find(p => p.code === req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });
    return res.json({ poll });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.patch("/api/polls/:id", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });
    Object.assign(poll, req.body, { updatedAt: new Date().toISOString() });
    trigger(poll.id, "poll:updated", { poll: { ...poll, responses: undefined } });
    return res.json({ poll });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.delete("/api/polls/:id", (req, res) => {
  try {
    if (!polls.has(req.params.id)) return res.status(404).json({ error: "Not found" });
    polls.delete(req.params.id);
    return res.json({ success: true });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get("/api/polls/:id/results", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });
    return res.json({ results: aggregateResults(poll), poll: { ...poll, responses: undefined } });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.get("/api/polls/:id/analytics", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });
    return res.json({
      poll: { ...poll, responses: undefined },
      results: aggregateResults(poll),
      responseTimeline: poll.responses.slice(-50).map((_, i) => ({ time: i, count: i + 1 })),
      devices: { desktop: Math.floor(poll.responses.length * 0.6), mobile: Math.floor(poll.responses.length * 0.4) }
    });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post("/api/polls/:id/vote", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });
    if (poll.status !== "live") return res.status(400).json({ error: "Poll is not live yet" });
    const { answer, participantId, participantName, correct, points } = req.body || {};
    const response = { id: uid(8), answer, participantId: participantId || uid(8), participantName, correct, points, createdAt: new Date().toISOString() };
    poll.responses.push(response);
    const results = aggregateResults(poll);
    trigger(poll.id, "poll:vote", { results, totalVotes: poll.responses.length });
    return res.json({ success: true, results });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post("/api/polls/:id/join", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Poll not found" });
    const { participantId, participantName } = req.body || {};
    poll.participants = poll.participants || [];
    if (!poll.participants.find(p => p.id === participantId)) {
      poll.participants.push({ id: participantId || uid(8), name: participantName || "Anonymous", joinedAt: new Date().toISOString() });
      trigger(poll.id, "participant:joined", { count: poll.participants.length, name: participantName });
    }
    return res.json({ success: true, count: poll.participants.length });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Poll lifecycle
app.post("/api/polls/:id/go-live", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Not found" });
    poll.status = "live"; poll.updatedAt = new Date().toISOString();
    trigger(poll.id, "poll:started", { poll: { ...poll, responses: undefined } });
    return res.json({ poll });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post("/api/polls/:id/pause", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Not found" });
    poll.status = "paused"; poll.updatedAt = new Date().toISOString();
    trigger(poll.id, "poll:paused", {});
    return res.json({ poll });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post("/api/polls/:id/end", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Not found" });
    poll.status = "closed"; poll.updatedAt = new Date().toISOString();
    trigger(poll.id, "poll:ended", { results: aggregateResults(poll) });
    return res.json({ poll });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Q&A
app.post("/api/polls/:id/qa/question", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Not found" });
    const q = { id: uid(8), text: req.body.text, author: req.body.author || "Anonymous", upvotes: 0, answered: false, starred: false, createdAt: new Date().toISOString() };
    poll.qaQuestions = poll.qaQuestions || [];
    poll.qaQuestions.push(q);
    trigger(poll.id, "qa:question", q);
    return res.json({ question: q });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.patch("/api/polls/:id/qa/:qid", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Not found" });
    const q = (poll.qaQuestions || []).find(x => x.id === req.params.qid);
    if (!q) return res.status(404).json({ error: "Question not found" });
    Object.assign(q, req.body);
    trigger(poll.id, "qa:updated", q);
    return res.json({ question: q });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

app.post("/api/polls/:id/qa/:qid/upvote", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Not found" });
    const q = (poll.qaQuestions || []).find(x => x.id === req.params.qid);
    if (!q) return res.status(404).json({ error: "Question not found" });
    q.upvotes = (q.upvotes || 0) + 1;
    trigger(poll.id, "qa:upvote", { questionId: q.id, upvotes: q.upvotes });
    return res.json({ upvotes: q.upvotes });
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// CSV Export
app.get("/api/polls/:id/export/csv", (req, res) => {
  try {
    const poll = polls.get(req.params.id);
    if (!poll) return res.status(404).json({ error: "Not found" });
    const rows = [["Participant", "Answer", "Timestamp"]];
    poll.responses.forEach(r => rows.push([r.participantName || r.participantId || "anon", JSON.stringify(r.answer), r.createdAt]));
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=poll-" + poll.id + ".csv");
    return res.send(rows.map(r => r.join(",")).join("\n"));
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Pusher auth
app.post("/api/pusher/auth", (req, res) => {
  try {
    if (!pusher) return res.status(503).json({ error: "Pusher not configured" });
    const { socket_id, channel_name } = req.body;
    const auth = pusher.authorizeChannel(socket_id, channel_name);
    return res.json(auth);
  } catch (e) { return res.status(500).json({ error: e.message }); }
});

// Health & root
app.get("/api/health", (_, res) => res.json({ status: "ok", polls: polls.size, users: users.size, pusher: !!pusher, ts: new Date().toISOString() }));
app.get("/", (_, res) => res.json({ name: "OmniPoll API", version: "2.0.0", status: "running" }));

// ── Vercel export ──────────────────────────────────────────────────
module.exports = app;
