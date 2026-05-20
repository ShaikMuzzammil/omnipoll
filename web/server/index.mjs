/**
 * OmniPoll Backend – Express + Socket.IO + File-based storage
 * Run: node server/index.mjs
 * API:  http://localhost:8787
 */

import { createServer } from "http";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:8080";
const DATA_FILE = join(__dirname, "data", "omnipoll.json");

// ── File store ────────────────────────────────────────────────
function readStore() {
  try {
    if (!fs.existsSync(DATA_FILE)) return { users: [], polls: [] };
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch { return { users: [], polls: [] }; }
}
function writeStore(data) {
  fs.mkdirSync(dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function getStore() { return readStore(); }
function saveStore(data) { writeStore(data); }

// ── Rate limiter (in-memory) ──────────────────────────────────
const voteLimiter = new Map();
function checkRateLimit(ip, pollId) {
  const key = `${ip}:${pollId}`;
  const now = Date.now();
  const window = 60_000;
  const max = 5;
  const entries = (voteLimiter.get(key) || []).filter(t => now - t < window);
  if (entries.length >= max) return false;
  entries.push(now);
  voteLimiter.set(key, entries);
  return true;
}

// ── Helpers ───────────────────────────────────────────────────
function uid(len = 8) { return Math.random().toString(36).slice(2, 2 + len).toUpperCase(); }
function now() { return Date.now(); }

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

const POS = ['great','good','excellent','amazing','awesome','love','fantastic','best','perfect','happy','wonderful','brilliant','nice','like','enjoy'];
const NEG = ['bad','terrible','hate','awful','poor','worst','dislike','boring','difficult','confusing','frustrating','wrong','fail','issue','problem'];

function analyzeSentiment(texts) {
  let pos = 0, neg = 0, total = 0;
  texts.forEach(t => {
    const words = t.toLowerCase().split(/\s+/);
    words.forEach(w => {
      if (POS.some(p => levenshtein(w, p) <= 1)) pos++;
      else if (NEG.some(n => levenshtein(w, n) <= 1)) neg++;
    });
    total += words.length;
  });
  if (!total) return { score: 50, label: 'neutral' };
  const ratio = (pos - neg) / (pos + neg + 1);
  const score = Math.round(50 + ratio * 50);
  return { score, label: score > 60 ? 'positive' : score < 40 ? 'negative' : 'neutral' };
}

function extractThemes(texts) {
  const freq = {};
  texts.forEach(t => t.toLowerCase().split(/\s+/).forEach(w => { if (w.length > 3) freq[w] = (freq[w] || 0) + 1; }));
  const groups = {};
  Object.entries(freq).forEach(([word, count]) => {
    let merged = false;
    for (const key in groups) { if (levenshtein(word, key) <= 2) { groups[key].count += count; merged = true; break; } }
    if (!merged) groups[word] = { label: word, count };
  });
  return Object.values(groups).sort((a, b) => b.count - a.count).slice(0, 6);
}

function aggregateResults(poll) {
  const r = { participants: poll.participants?.length || 0 };
  if (poll.type === 'multiple_choice') {
    const totalVotes = poll.responses.reduce((s, resp) => {
      const ans = resp.answer;
      return s + (Array.isArray(ans) ? ans.length : 1);
    }, 0);
    r.totalVotes = totalVotes;
    r.options = poll.options.map(opt => {
      const votes = poll.responses.filter(resp => {
        const ans = resp.answer;
        return Array.isArray(ans) ? ans.includes(opt.id) : ans === opt.id;
      }).length;
      return { ...opt, votes, pct: totalVotes ? Math.round(votes / totalVotes * 100) : 0 };
    });
  } else if (poll.type === 'word_cloud') {
    const freq = {};
    poll.responses.forEach(resp => { const w = (resp.answer || '').toLowerCase().trim(); if (w) freq[w] = (freq[w] || 0) + 1; });
    r.words = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([text, count]) => ({ text, count }));
    r.totalResponses = poll.responses.length;
    const texts = poll.responses.map(resp => resp.answer || '');
    r.sentiment = analyzeSentiment(texts);
    r.themes = extractThemes(texts);
  } else if (poll.type === 'qa') {
    r.questions = [...poll.qaQuestions].sort((a, b) => b.upvotes - a.upvotes);
    const texts = poll.qaQuestions.map(q => q.questionText);
    r.sentiment = analyzeSentiment(texts);
    r.themes = extractThemes(texts);
  } else if (poll.type === 'quiz') {
    const scoreMap = {}, nameMap = {}, correctMap = {}, answeredMap = {};
    poll.responses.forEach(resp => {
      const pid = resp.participantId || 'anon';
      nameMap[pid] = resp.participantName || 'Anonymous';
      scoreMap[pid] = (scoreMap[pid] || 0) + (resp.score || 0);
      answeredMap[pid] = (answeredMap[pid] || 0) + 1;
      if (resp.isCorrect) correctMap[pid] = (correctMap[pid] || 0) + 1;
    });
    r.leaderboard = Object.entries(scoreMap).map(([participantId, score]) => ({
      participantId, name: nameMap[participantId], score,
      answered: answeredMap[participantId] || 0, correct: correctMap[participantId] || 0
    })).sort((a, b) => b.score - a.score);
    r.submissions = poll.responses;
  } else if (poll.type === 'rating') {
    const vals = poll.responses.map(r => Number(r.answer)).filter(v => !isNaN(v));
    r.totalResponses = vals.length;
    r.average = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    const dist = {};
    const min = poll.settings?.min || 1, max = poll.settings?.max || 5;
    for (let i = min; i <= max; i++) dist[i] = 0;
    vals.forEach(v => { dist[v] = (dist[v] || 0) + 1; });
    r.distribution = dist;
  }
  return r;
}

// ── Express app ───────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }
});

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// Helper to emit poll update to all in room
function emitPollUpdate(pollId) {
  const store = getStore();
  const poll = store.polls.find(p => p.id === pollId);
  if (!poll) return;
  const results = aggregateResults(poll);
  io.to(pollId).emit('pollUpdate', { poll, results });
}

// ── Auth routes ───────────────────────────────────────────────
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const store = getStore();
  if (store.users.find(u => u.email === email)) return res.status(409).json({ error: 'Email already registered' });
  const user = { id: uid(10), name, email, password, createdAt: now() };
  store.users.push(user);
  saveStore(store);
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

app.post('/api/auth/signin', (req, res) => {
  const { email, password } = req.body;
  const store = getStore();
  const user = store.users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ user: { id: user.id, name: user.name, email: user.email } });
});

// ── Poll routes ───────────────────────────────────────────────
app.post('/api/polls', (req, res) => {
  const { title, type, question, settings, options, quizQuestions, creatorId } = req.body;
  if (!title || !type || !question) return res.status(400).json({ error: 'Missing required fields' });
  const poll = {
    id: uid(10), code: uid(6), title, type, question,
    settings: settings || {},
    options: options || [],
    quizQuestions: quizQuestions || [],
    responses: [], qaQuestions: [],
    status: 'live',
    creatorId, participants: [],
    createdAt: now(),
    expiresAt: settings?.duration ? now() + settings.duration * 60000 : null
  };
  const store = getStore();
  store.polls.push(poll);
  saveStore(store);
  res.status(201).json({ poll, results: aggregateResults(poll) });
});

app.get('/api/polls', (req, res) => {
  const { creatorId } = req.query;
  const store = getStore();
  let polls = store.polls;
  if (creatorId) polls = polls.filter(p => p.creatorId === creatorId);
  res.json({ polls: polls.sort((a, b) => b.createdAt - a.createdAt) });
});

app.get('/api/polls/:id', (req, res) => {
  const store = getStore();
  const poll = store.polls.find(p => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  res.json({ poll, results: aggregateResults(poll) });
});

app.get('/api/join', (req, res) => {
  const { code } = req.query;
  const store = getStore();
  const poll = store.polls.find(p => p.code === code?.toUpperCase());
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  res.json({ poll, results: aggregateResults(poll) });
});

app.get('/api/polls/:id/results', (req, res) => {
  const store = getStore();
  const poll = store.polls.find(p => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  res.json({ poll, results: aggregateResults(poll) });
});

app.post('/api/polls/:id/vote', (req, res) => {
  const ip = req.ip;
  const { id } = req.params;
  if (!checkRateLimit(ip, id)) return res.status(429).json({ error: 'Rate limit exceeded' });
  const store = getStore();
  const idx = store.polls.findIndex(p => p.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Poll not found' });
  const poll = store.polls[idx];
  if (poll.status === 'closed') return res.status(403).json({ error: 'Poll is closed' });
  if (poll.status === 'paused') return res.status(403).json({ error: 'Poll is paused' });
  const { participantId, participantName, answer } = req.body;
  // Track participant
  if (participantId && !poll.participants.includes(participantId)) {
    store.polls[idx].participants = [...poll.participants, participantId];
  }
  store.polls[idx].responses.push({ id: uid(), participantId, participantName, answer, createdAt: now() });
  saveStore(store);
  const results = aggregateResults(store.polls[idx]);
  emitPollUpdate(id);
  res.json({ results });
});

// Q&A routes
app.post('/api/polls/:id/qa', (req, res) => {
  const store = getStore();
  const idx = store.polls.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Poll not found' });
  const { questionText, participantId } = req.body;
  if (!questionText) return res.status(400).json({ error: 'Question text required' });
  const question = { id: uid(), questionText, upvotes: 0, status: 'open', participantId, createdAt: now() };
  store.polls[idx].qaQuestions = [...(store.polls[idx].qaQuestions || []), question];
  saveStore(store);
  emitPollUpdate(req.params.id);
  res.status(201).json({ question });
});

app.put('/api/polls/:id/qa/:questionId/upvote', (req, res) => {
  const store = getStore();
  const idx = store.polls.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Poll not found' });
  const qIdx = store.polls[idx].qaQuestions.findIndex(q => q.id === req.params.questionId);
  if (qIdx < 0) return res.status(404).json({ error: 'Question not found' });
  store.polls[idx].qaQuestions[qIdx].upvotes++;
  saveStore(store);
  emitPollUpdate(req.params.id);
  res.json({ question: store.polls[idx].qaQuestions[qIdx] });
});

// Quiz routes
app.post('/api/polls/:id/quiz/submit', (req, res) => {
  const store = getStore();
  const idx = store.polls.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Poll not found' });
  const { participantId, participantName, questionId, selectedAnswer, timeLeft } = req.body;
  const poll = store.polls[idx];
  const qq = poll.quizQuestions.find(q => q.id === questionId);
  if (!qq) return res.status(404).json({ error: 'Question not found' });
  const isCorrect = selectedAnswer === qq.correctAnswer;
  const points = isCorrect ? Math.max(50, qq.points - Math.floor(((qq.timeLimit || 20) - (timeLeft || 0)) * 2)) : 0;
  if (!poll.participants.includes(participantId)) {
    store.polls[idx].participants = [...poll.participants, participantId];
  }
  store.polls[idx].responses.push({ id: uid(), participantId, participantName, answer: selectedAnswer, questionId, isCorrect, score: points, createdAt: now() });
  saveStore(store);
  const results = aggregateResults(store.polls[idx]);
  emitPollUpdate(req.params.id);
  res.json({ isCorrect, points, results });
});

app.get('/api/polls/:id/quiz/leaderboard', (req, res) => {
  const store = getStore();
  const poll = store.polls.find(p => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  const results = aggregateResults(poll);
  res.json({ leaderboard: results.leaderboard || [] });
});

// Status
app.patch('/api/polls/:id/status', (req, res) => {
  const store = getStore();
  const idx = store.polls.findIndex(p => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Poll not found' });
  const { status } = req.body;
  if (!['live', 'paused', 'closed'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  store.polls[idx].status = status;
  saveStore(store);
  emitPollUpdate(req.params.id);
  io.to(req.params.id).emit('statusChanged', { status });
  res.json({ poll: store.polls[idx], results: aggregateResults(store.polls[idx]) });
});

// Delete
app.delete('/api/polls/:id', (req, res) => {
  const store = getStore();
  store.polls = store.polls.filter(p => p.id !== req.params.id);
  saveStore(store);
  res.json({ success: true });
});

// CSV export
app.get('/api/polls/:id/export/csv', (req, res) => {
  const store = getStore();
  const poll = store.polls.find(p => p.id === req.params.id);
  if (!poll) return res.status(404).json({ error: 'Not found' });
  const results = aggregateResults(poll);
  let csv = `OmniPoll Export\nTitle,${poll.title}\nType,${poll.type}\nCode,${poll.code}\nStatus,${poll.status}\nParticipants,${results.participants}\n\n`;
  if (poll.type === 'multiple_choice') {
    csv += 'Option,Votes,Percentage\n';
    (results.options || []).forEach(o => { csv += `"${o.text}",${o.votes},${o.pct}%\n`; });
  } else if (poll.type === 'word_cloud') {
    csv += 'Word,Count\n';
    (results.words || []).forEach(w => { csv += `"${w.text}",${w.count}\n`; });
  } else if (poll.type === 'qa') {
    csv += 'Question,Upvotes\n';
    (results.questions || []).forEach(q => { csv += `"${q.questionText}",${q.upvotes}\n`; });
  } else if (poll.type === 'quiz') {
    csv += 'Rank,Name,Score,Correct,Answered\n';
    (results.leaderboard || []).forEach((r, i) => { csv += `${i + 1},"${r.name}",${r.score},${r.correct},${r.answered}\n`; });
  } else if (poll.type === 'rating') {
    csv += `Average,${(results.average || 0).toFixed(2)}\nTotal,${results.totalResponses}\n\nValue,Count\n`;
    Object.entries(results.distribution || {}).forEach(([v, c]) => { csv += `${v},${c}\n`; });
  }
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="omnipoll-${poll.code}.csv"`);
  res.send(csv);
});

// ── Socket.IO ─────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinPoll', ({ pollId }) => {
    if (!pollId) return;
    socket.join(pollId);
    // Send current state
    const store = getStore();
    const poll = store.polls.find(p => p.id === pollId);
    if (poll) socket.emit('pollUpdate', { poll, results: aggregateResults(poll) });
  });

  socket.on('joinByCode', ({ code }) => {
    const store = getStore();
    const poll = store.polls.find(p => p.code === code?.toUpperCase());
    if (poll) { socket.join(poll.id); socket.emit('pollUpdate', { poll, results: aggregateResults(poll) }); }
    else socket.emit('error', { message: 'Poll not found' });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`OmniPoll API + Socket.IO running on http://localhost:${PORT}`);
  console.log(`Accept connections from: ${CLIENT_ORIGIN}`);
});
