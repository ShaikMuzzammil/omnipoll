// api/index.js — OmniPoll v2 Backend (CommonJS — Vercel Serverless compatible)
'use strict';

const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { neon } = require('@neondatabase/serverless');
const Pusher  = require('pusher');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));

// ── Helpers ─────────────────────────────────────────────────────────────────
function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
  return neon(process.env.DATABASE_URL);
}

function genId(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(len), b => chars[b % chars.length]).join('');
}

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.randomBytes(6), b => chars[b % chars.length]).join('');
}

function getPusher() {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID) return null;
  return new Pusher({ appId: PUSHER_APP_ID, key: PUSHER_KEY, secret: PUSHER_SECRET, cluster: PUSHER_CLUSTER || 'ap2', useTLS: true });
}

async function broadcast(pollId, event, data) {
  try {
    const p = getPusher();
    if (p) await p.trigger(`poll-${pollId}`, event, data);
  } catch (e) { console.warn('[Pusher]', e.message); }
}

function rowToPoll(row) {
  return {
    id: row.id, code: row.code, title: row.title, question: row.question,
    description: row.description, type: row.type, status: row.status,
    settings: row.settings || {}, options: row.options || [],
    quizQuestions: row.quiz_questions || [],
    creatorId: row.creator_id, participants: row.participants || [],
    responses: [], qaQuestions: [], quizSubmissions: [],
    createdAt: Number(row.created_at),
    updatedAt: row.updated_at ? Number(row.updated_at) : undefined,
    expiresAt: row.expires_at ? Number(row.expires_at) : null,
  };
}

async function getPollFull(pollId) {
  const sql = db();
  const rows = await sql`SELECT * FROM polls WHERE id = ${pollId} LIMIT 1`;
  if (!rows[0]) return null;
  const poll = rowToPoll(rows[0]);

  const [responses, qaQs, quizSubs] = await Promise.all([
    sql`SELECT * FROM poll_responses WHERE poll_id = ${pollId} ORDER BY created_at DESC`,
    sql`SELECT * FROM qa_questions WHERE poll_id = ${pollId} ORDER BY upvotes DESC`,
    sql`SELECT * FROM quiz_submissions WHERE poll_id = ${pollId} ORDER BY score DESC`,
  ]);

  poll.responses = responses.map(r => ({
    id: r.id, participantId: r.participant_id, participantName: r.participant_name,
    answer: r.answer, questionId: r.question_id, isCorrect: r.is_correct,
    score: r.score, createdAt: Number(r.created_at),
  }));
  poll.qaQuestions = qaQs.map(q => ({
    id: q.id, questionText: q.question_text, upvotes: q.upvotes,
    status: q.status, participantId: q.participant_id, createdAt: Number(q.created_at),
  }));
  poll.quizSubmissions = quizSubs.map(s => ({
    participantId: s.participant_id, participantName: s.participant_name,
    score: s.score, correct: s.correct, answered: s.answered,
    answers: s.answers || [], completedAt: Number(s.completed_at),
  }));
  return poll;
}

function computeResults(poll) {
  const r = { participants: poll.participants?.length || 0, totalVotes: poll.responses.length };
  const type = poll.type;

  if (['multiple_choice','image_choice','true_false','countdown_vote','poll_series','bracket'].includes(type)) {
    const counts = {}; poll.options.forEach(o => { counts[o.id] = 0; });
    poll.responses.forEach(res => { const a = String(res.answer); if (counts[a] !== undefined) counts[a]++; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    r.options = poll.options.map(o => ({ ...o, votes: counts[o.id]||0, pct: total ? Math.round(((counts[o.id]||0)/total)*100) : 0 }));
  }

  if (type === 'word_cloud' || type === 'open_text') {
    const freq = {};
    poll.responses.forEach(res => {
      const text = String(res.answer||'').trim().toLowerCase(); if (!text) return;
      if (type === 'word_cloud') { text.split(/\s+/).filter(w=>w.length>2).forEach(w=>{freq[w]=(freq[w]||0)+1;}); }
      else { freq[text] = (freq[text]||0)+1; }
    });
    r.words = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,60).map(([text,count])=>({text,count}));
    r.submissions = poll.responses;
    r.answers = poll.responses.map(res=>String(res.answer||'')).filter(Boolean);
  }

  if (type === 'fill_blank') r.answers = poll.responses.map(res=>String(res.answer||'')).filter(Boolean);
  if (type === 'qa') r.questions = [...poll.qaQuestions].sort((a,b)=>b.upvotes-a.upvotes);

  if (type === 'quiz') {
    r.leaderboard = [...(poll.quizSubmissions||[])].sort((a,b)=>b.score-a.score).slice(0,20).map(s=>({
      participantId:s.participantId, name:s.participantName||'Anonymous', score:s.score, correct:s.correct||0, answered:s.answered||0
    }));
  }

  if (type === 'rating' || type === 'nps') {
    const nums = poll.responses.map(res=>Number(res.answer)).filter(n=>!isNaN(n));
    r.average = nums.length ? Math.round((nums.reduce((a,b)=>a+b,0)/nums.length)*10)/10 : 0;
    const dist = {}; nums.forEach(n=>{dist[String(n)]=(dist[String(n)]||0)+1;}); r.distribution = dist;
    if (type === 'nps') {
      const total = nums.length||1;
      const det=nums.filter(n=>n<=6).length, pas=nums.filter(n=>n===7||n===8).length, pro=nums.filter(n=>n>=9).length;
      r.detractors=det; r.passives=pas; r.promoters=pro;
      r.npsScore = Math.round(((pro-det)/total)*100);
    }
  }

  if (type === 'slider') {
    const nums = poll.responses.map(res=>Number(res.answer)).filter(n=>!isNaN(n));
    r.average = nums.length ? Math.round((nums.reduce((a,b)=>a+b,0)/nums.length)*10)/10 : 0;
    const dist = {}; nums.forEach(n=>{const b=String(Math.round(n/10)*10);dist[b]=(dist[b]||0)+1;}); r.distribution = dist;
  }

  if (type === 'ranking') {
    const pts = {}; poll.options.forEach(o=>{pts[o.id]=0;});
    poll.responses.forEach(res=>{const ranked=Array.isArray(res.answer)?res.answer:[];ranked.forEach((id,idx)=>{if(pts[id]!==undefined)pts[id]+=poll.options.length-idx;});});
    r.rankingResults = poll.options.map(o=>({id:o.id,text:o.text,points:pts[o.id]||0,avgRank:poll.responses.length?(pts[o.id]/poll.responses.length):0})).sort((a,b)=>b.points-a.points);
  }

  if (type === 'matrix') {
    const mat = {}; (poll.settings?.matrixRows||[]).forEach(row=>{mat[row.id]={}; (poll.settings?.matrixColumns||[]).forEach(col=>{mat[row.id][col.id]=0;});});
    poll.responses.forEach(res=>{ const ans=res.answer||{}; Object.entries(ans).forEach(([rid,cid])=>{if(mat[rid]?.[cid]!==undefined)mat[rid][cid]++;});});
    r.matrixResults = mat;
  }

  if (type === 'emoji_reaction') {
    const counts = {}; poll.responses.forEach(res=>{const e=String(res.answer);counts[e]=(counts[e]||0)+1;}); r.emojiCounts = counts;
  }

  if (type === 'heatmap') r.heatmapPoints = poll.responses.map(res=>res.answer).filter(Boolean);

  if (type === 'prioritization') {
    const tots = {}; poll.options.forEach(o=>{tots[o.id]=0;});
    poll.responses.forEach(res=>{ const alloc=res.answer||{}; Object.entries(alloc).forEach(([id,pts])=>{if(tots[id]!==undefined)tots[id]+=Number(pts);});});
    r.options = poll.options.map(o=>({...o,votes:tots[o.id]||0,pct:poll.responses.length?Math.round(tots[o.id]/poll.responses.length):0})).sort((a,b)=>b.votes-a.votes);
  }

  if (type === 'live_matching') {
    const pairs = poll.settings?.matchingPairs||[];
    r.matchingResults = pairs.map(pair=>({
      left:pair.left, right:pair.right,
      correct:poll.responses.filter(res=>{const a=res.answer||{};return a[pair.id]===pair.right;}).length,
      total:poll.responses.length
    }));
  }

  return r;
}

// ── Auth middleware ──────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try { req.user = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret'); } catch { /* */ }
  }
  next();
}
app.use(authMiddleware);

// ── Auth routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim()||!email?.trim()||!password) return res.status(400).json({ error:'Name, email and password required' });
    if (password.length < 6) return res.status(400).json({ error:'Password must be at least 6 characters' });
    const sql = db();
    const [existing] = await sql`SELECT id FROM users WHERE email=${email.toLowerCase().trim()} LIMIT 1`;
    if (existing) return res.status(409).json({ error:'Email already in use' });
    const hash = await bcrypt.hash(password, 10);
    const id = genId();
    const [user] = await sql`INSERT INTO users (id,name,email,password_hash) VALUES (${id},${name.trim()},${email.toLowerCase().trim()},${hash}) RETURNING id,name,email,plan`;
    const token = jwt.sign({ sub:user.id, name:user.name, email:user.email, plan:user.plan||'free' }, process.env.JWT_SECRET||'dev-secret', { expiresIn:'30d' });
    res.status(201).json({ user:{ id:user.id, name:user.name, email:user.email, plan:user.plan||'free' }, token });
  } catch (e) { console.error('[signup]', e); res.status(500).json({ error:e.message||'Internal error' }); }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim()||!password) return res.status(400).json({ error:'Email and password required' });
    const sql = db();
    const [user] = await sql`SELECT * FROM users WHERE email=${email.toLowerCase().trim()} LIMIT 1`;
    if (!user) return res.status(401).json({ error:'Invalid email or password' });
    if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error:'Invalid email or password' });
    const token = jwt.sign({ sub:user.id, name:user.name, email:user.email, plan:user.plan||'free' }, process.env.JWT_SECRET||'dev-secret', { expiresIn:'30d' });
    res.json({ user:{ id:user.id, name:user.name, email:user.email, plan:user.plan||'free' }, token });
  } catch (e) { console.error('[signin]', e); res.status(500).json({ error:e.message||'Internal error' }); }
});

// ── Poll routes ──────────────────────────────────────────────────────────────
app.get('/api/polls', async (req, res) => {
  try {
    const sql = db();
    const creatorId = req.query.creatorId;
    const rows = creatorId
      ? await sql`SELECT * FROM polls WHERE creator_id=${creatorId} ORDER BY created_at DESC`
      : await sql`SELECT * FROM polls ORDER BY created_at DESC LIMIT 100`;
    res.json({ polls: rows.map(rowToPoll) });
  } catch (e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/polls', async (req, res) => {
  try {
    const { title, question, description, type, settings={}, options=[], quizQuestions=[], creatorId, expiresAt } = req.body;
    if (!title||!question||!type) return res.status(400).json({ error:'title, question, type required' });
    const id = genId(), code = genCode();
    const creator = req.user?.sub || creatorId || null;
    const sql = db();
    const [row] = await sql`
      INSERT INTO polls (id,code,title,question,description,type,settings,options,quiz_questions,creator_id,expires_at)
      VALUES (${id},${code},${String(title)},${String(question)},${description||null},${String(type)},
              ${JSON.stringify(settings)},${JSON.stringify(options)},${JSON.stringify(quizQuestions)},
              ${creator},${expiresAt?Number(expiresAt):null})
      RETURNING *`;
    res.status(201).json({ poll: rowToPoll(row) });
  } catch (e) { console.error('[create poll]', e); res.status(500).json({ error:e.message }); }
});

app.get('/api/polls/:id', async (req, res) => {
  try {
    const poll = await getPollFull(req.params.id);
    if (!poll) return res.status(404).json({ error:'Poll not found' });
    const results = computeResults(poll);
    res.json({ poll, results });
  } catch (e) { res.status(500).json({ error:e.message }); }
});

app.delete('/api/polls/:id', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error:'Unauthorized' });
    const sql = db();
    await sql`DELETE FROM polls WHERE id=${req.params.id}`;
    res.json({ success:true });
  } catch (e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/polls/:id/vote', async (req, res) => {
  try {
    const { participantId, participantName='Anonymous', answer, questionId, isCorrect, score, quizSubmission } = req.body;
    if (!participantId) return res.status(400).json({ error:'participantId required' });
    const poll = await getPollFull(req.params.id);
    if (!poll) return res.status(404).json({ error:'Poll not found' });
    if (poll.status !== 'live') return res.status(400).json({ error:'Poll is not live' });
    if (poll.settings?.oneVote !== false && poll.type !== 'quiz' && poll.type !== 'qa') {
      if (poll.responses.some(r=>r.participantId===participantId)) return res.status(409).json({ error:'Already voted' });
    }
    const sql = db();
    await sql`INSERT INTO poll_responses (id,poll_id,participant_id,participant_name,answer,question_id,is_correct,score)
              VALUES (${genId()},${req.params.id},${participantId},${participantName},${JSON.stringify(answer)},
                      ${questionId||null},${isCorrect!=null?Boolean(isCorrect):null},${score!=null?Number(score):0})`;
    // Add participant
    await sql`UPDATE polls SET participants=(CASE WHEN participants @> ${JSON.stringify([participantId])}::jsonb THEN participants ELSE participants||${JSON.stringify([participantId])}::jsonb END),updated_at=${Date.now()} WHERE id=${req.params.id}`;
    // Quiz submission
    if (poll.type === 'quiz' && quizSubmission) {
      const qs = quizSubmission;
      await sql`INSERT INTO quiz_submissions (id,poll_id,participant_id,participant_name,score,correct,answered,answers)
                VALUES (${genId()},${req.params.id},${participantId},${participantName},${Number(qs.score||0)},${Number(qs.correct||0)},${Number(qs.answered||0)},${JSON.stringify(qs.answers||[])})
                ON CONFLICT DO NOTHING`;
    }
    // Broadcast
    const updated = await getPollFull(req.params.id);
    if (updated) {
      const results = computeResults(updated);
      await broadcast(req.params.id, 'results-update', results);
      await broadcast(req.params.id, 'participant-joined', { count: updated.participants.length });
    }
    res.json({ success:true });
  } catch (e) { console.error('[vote]', e); res.status(500).json({ error:e.message }); }
});

app.get('/api/polls/:id/results', async (req, res) => {
  try {
    const poll = await getPollFull(req.params.id);
    if (!poll) return res.status(404).json({ error:'Poll not found' });
    res.json({ results: computeResults(poll), participants: poll.participants.length });
  } catch (e) { res.status(500).json({ error:e.message }); }
});

app.patch('/api/polls/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['live','paused','closed'].includes(status)) return res.status(400).json({ error:'Invalid status' });
    const sql = db();
    await sql`UPDATE polls SET status=${status},updated_at=${Date.now()} WHERE id=${req.params.id}`;
    await broadcast(req.params.id, 'status-changed', { status });
    res.json({ success:true, status });
  } catch (e) { res.status(500).json({ error:e.message }); }
});

// ── Q&A routes ──────────────────────────────────────────────────────────────
app.get('/api/polls/:id/qa', async (req, res) => {
  try {
    const sql = db();
    const rows = await sql`SELECT * FROM qa_questions WHERE poll_id=${req.params.id} ORDER BY upvotes DESC`;
    res.json({ questions: rows.map(q=>({id:q.id,questionText:q.question_text,upvotes:q.upvotes,status:q.status,participantId:q.participant_id,createdAt:Number(q.created_at)})) });
  } catch (e) { res.status(500).json({ error:e.message }); }
});

app.post('/api/polls/:id/qa', async (req, res) => {
  try {
    const { questionText, participantId } = req.body;
    if (!questionText?.trim()) return res.status(400).json({ error:'questionText required' });
    const sql = db();
    const id = genId();
    await sql`INSERT INTO qa_questions (id,poll_id,question_text,participant_id) VALUES (${id},${req.params.id},${questionText.trim()},${participantId||'anon'})`;
    const poll = await getPollFull(req.params.id);
    if (poll) await broadcast(req.params.id, 'qa-update', { questions: poll.qaQuestions });
    res.status(201).json({ success:true, id });
  } catch (e) { res.status(500).json({ error:e.message }); }
});

app.put('/api/polls/:id/qa/:qid/upvote', async (req, res) => {
  try {
    const sql = db();
    await sql`UPDATE qa_questions SET upvotes=upvotes+1 WHERE id=${req.params.qid} AND poll_id=${req.params.id}`;
    const poll = await getPollFull(req.params.id);
    if (poll) await broadcast(req.params.id, 'qa-update', { questions: poll.qaQuestions });
    res.json({ success:true });
  } catch (e) { res.status(500).json({ error:e.message }); }
});

// ── Join route ───────────────────────────────────────────────────────────────
app.get('/api/join', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error:'code required' });
    const sql = db();
    const [row] = await sql`SELECT * FROM polls WHERE code=${String(code).toUpperCase().trim()} LIMIT 1`;
    if (!row) return res.status(404).json({ error:'Poll not found' });
    const poll = await getPollFull(row.id);
    if (poll) { poll.responses = []; }
    res.json({ poll });
  } catch (e) { res.status(500).json({ error:e.message }); }
});

// ── Analytics ────────────────────────────────────────────────────────────────
app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const creatorId = req.query.creatorId;
    if (!creatorId) return res.status(400).json({ error:'creatorId required' });
    const sql = db();
    const [stats] = await sql`SELECT COUNT(*) AS total_polls, COUNT(*) FILTER (WHERE status='live') AS live_polls, COUNT(*) FILTER (WHERE status='closed') AS closed_polls FROM polls WHERE creator_id=${creatorId}`;
    const [resp] = await sql`SELECT COALESCE(SUM(jsonb_array_length(p.participants)),0) AS total_participants, (SELECT COUNT(*) FROM poll_responses pr JOIN polls pp ON pr.poll_id=pp.id WHERE pp.creator_id=${creatorId}) AS total_responses FROM polls p WHERE p.creator_id=${creatorId}`;
    res.json({
      totalPolls: Number(stats?.total_polls||0),
      livePolls:  Number(stats?.live_polls||0),
      closedPolls:Number(stats?.closed_polls||0),
      totalParticipants:Number(resp?.total_participants||0),
      totalResponses:Number(resp?.total_responses||0),
    });
  } catch (e) { res.status(500).json({ error:e.message }); }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok:true, ts:Date.now() }));

// ── Export for Vercel ────────────────────────────────────────────────────────
module.exports = app;
