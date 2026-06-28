'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { Pool } = require('pg');
const Pusher   = require('pusher');

const app = express();
app.use(express.json({ limit: '2mb' }));

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  next();
});

// ── DB ────────────────────────────────────────────────────────────────────────
let _pool = null;
function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set. Please add it in Vercel → Settings → Environment Variables.');
  }
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 3,
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 30000,
    });
    _pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message);
      _pool = null; // reset so next request retries
    });
  }
  return _pool;
}

async function db(sql, params = []) {
  const pool   = getPool();
  const client = await pool.connect();
  try { return await client.query(sql, params); }
  finally { client.release(); }
}

// ── Auto-migration (runs on cold start if tables missing) ─────────────────────
let _migrated = false;
async function ensureTables() {
  if (_migrated) return;
  try {
    await db(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'teacher',
        institution TEXT,
        avatar TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS polls (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        creator_id TEXT NOT NULL,
        classroom_id TEXT,
        options JSONB NOT NULL DEFAULT '[]',
        questions JSONB DEFAULT '[]',
        matrix_rows JSONB NOT NULL DEFAULT '[]',
        matrix_cols JSONB NOT NULL DEFAULT '[]',
        settings JSONB NOT NULL DEFAULT '{}',
        scheduled_start_at TIMESTAMPTZ,
        closed_at TIMESTAMPTZ,
        results_released_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS votes (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        poll_id TEXT NOT NULL,
        user_id TEXT,
        guest_name TEXT,
        guest_email TEXT,
        selected_options JSONB NOT NULL DEFAULT '[]',
        text_answer TEXT,
        numeric_answer NUMERIC,
        ranking_order JSONB,
        matrix_answers JSONB,
        heatmap_x NUMERIC,
        heatmap_y NUMERIC,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS attempts (
        id TEXT PRIMARY KEY,
        poll_id TEXT NOT NULL,
        user_id TEXT,
        guest_name TEXT,
        guest_email TEXT,
        status TEXT NOT NULL DEFAULT 'in_progress',
        score NUMERIC,
        max_score NUMERIC,
        percentage NUMERIC,
        passed BOOLEAN,
        time_taken INTEGER,
        answers JSONB DEFAULT '[]',
        answers_draft JSONB DEFAULT '{}',
        submitted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS classrooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        subject TEXT,
        code TEXT UNIQUE NOT NULL,
        teacher_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS classroom_students (
        classroom_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (classroom_id, user_id)
      );
      CREATE TABLE IF NOT EXISTS qa_items (
        id TEXT PRIMARY KEY,
        poll_id TEXT NOT NULL,
        text TEXT NOT NULL,
        author_name TEXT NOT NULL DEFAULT 'Anonymous',
        author_user_id TEXT,
        upvotes INTEGER NOT NULL DEFAULT 0,
        answered BOOLEAN NOT NULL DEFAULT FALSE,
        answer TEXT,
        status TEXT NOT NULL DEFAULT 'approved',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        data JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        poll_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS tab_alerts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        poll_id TEXT NOT NULL,
        student_name TEXT NOT NULL DEFAULT 'Anonymous',
        student_email TEXT,
        student_user_id TEXT,
        switch_count INTEGER NOT NULL DEFAULT 1,
        severity TEXT NOT NULL DEFAULT 'low',
        classroom_name TEXT,
        poll_title TEXT,
        is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    // Add questions column if missing (for existing databases)
    try { await db(`ALTER TABLE polls ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]'`); } catch {}
    // Add subject to classrooms if missing
    try { await db(`ALTER TABLE classrooms ADD COLUMN IF NOT EXISTS subject TEXT`); } catch {}
    _migrated = true;
    console.log('[OmniPoll] Tables verified ✓');
  } catch (e) {
    console.error('[OmniPoll] ensureTables error:', e.message);
  }
}

// Run auto-migration middleware
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/api/health') {
    await ensureTables();
  }
  next();
});



// ── Pusher ────────────────────────────────────────────────────────────────────
let pusher = null;
if (process.env.PUSHER_APP_ID) {
  pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key:   process.env.PUSHER_KEY,
    secret:process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER || 'ap2',
    useTLS: true,
  });
}

async function push(channel, event, data) {
  if (!pusher) return;
  try { await pusher.trigger(channel, event, data); } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'omnipoll_dev_secret_change_in_production';

function sign(payload)  { return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }); }
function verify(token)  { return jwt.verify(token, JWT_SECRET); }

function genCode(len = 6) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function auth(req, res, optional = false) {
  const header = req.headers.authorization || '';
  const token  = header.replace('Bearer ', '').trim();
  if (!token) {
    if (optional) return null;
    res.status(401).json({ error: 'No token' });
    return false;
  }
  try {
    const payload = verify(token);
    const r = await db('SELECT * FROM users WHERE id=$1', [payload.id]);
    if (!r.rows[0]) { res.status(401).json({ error: 'User not found' }); return false; }
    return r.rows[0];
  } catch {
    if (optional) return null;
    res.status(401).json({ error: 'Invalid token' });
    return false;
  }
}

function err(res, code, msg) { res.status(code).json({ error: msg }); }
function ok(res, data)       { res.json(data); }

// ── AUTH ──────────────────────────────────────────────────────────────────────

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role = 'teacher' } = req.body;
    if (!name || !email || !password) return err(res, 400, 'Missing fields');
    if (password.length < 6) return err(res, 400, 'Password too short');
    const exists = await db('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (exists.rows[0]) return err(res, 409, 'Email already registered');
    const hash = await bcrypt.hash(password, 10);
    const id   = uid();
    await db(
      'INSERT INTO users (id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5)',
      [id, name.trim(), email.toLowerCase(), hash, role]
    );
    const user = { id, name: name.trim(), email: email.toLowerCase(), role };
    ok(res, { token: sign({ id }), user });
  } catch (e) { err(res, 500, e.message); }
});

// POST /api/auth/signin
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return err(res, 400, 'Missing fields');
    const r = await db('SELECT * FROM users WHERE email=$1', [email.toLowerCase()]);
    const u  = r.rows[0];
    if (!u) return err(res, 401, 'Invalid email or password');
    const ok2 = await bcrypt.compare(password, u.password_hash);
    if (!ok2) return err(res, 401, 'Invalid email or password');
    const user = { id:u.id, name:u.name, email:u.email, role:u.role, institution:u.institution, createdAt:u.created_at };
    ok(res, { token: sign({ id: u.id }), user });
  } catch (e) { err(res, 500, e.message); }
});

// GET /api/auth/me
app.get('/api/auth/me', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  ok(res, { id:u.id, name:u.name, email:u.email, role:u.role, institution:u.institution, createdAt:u.created_at });
});

// PUT /api/auth/me
app.put('/api/auth/me', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const { name, institution, currentPassword, newPassword } = req.body;
    if (newPassword) {
      const match = await bcrypt.compare(currentPassword || '', u.password_hash);
      if (!match) return err(res, 401, 'Current password incorrect');
      const hash = await bcrypt.hash(newPassword, 10);
      await db('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, u.id]);
    }
    if (name || institution !== undefined) {
      await db('UPDATE users SET name=COALESCE($1,name), institution=COALESCE($2,institution) WHERE id=$3',
        [name||null, institution||null, u.id]);
    }
    ok(res, { message: 'Updated' });
  } catch (e) { err(res, 500, e.message); }
});

// ── POLLS ─────────────────────────────────────────────────────────────────────

// GET /api/polls
app.get('/api/polls', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db(
      `SELECT p.*, 
        (SELECT COUNT(*)::int FROM votes v WHERE v.poll_id=p.id) AS total_votes,
        (SELECT COUNT(DISTINCT COALESCE(v.user_id, v.guest_email, v.id::text))::int FROM votes v WHERE v.poll_id=p.id) AS unique_participants
       FROM polls p WHERE p.creator_id=$1 ORDER BY p.created_at DESC`,
      [u.id]
    );
    ok(res, r.rows.map(formatPoll));
  } catch (e) { err(res, 500, e.message); }
});

// GET /api/polls/:id
app.get('/api/polls/:id', async (req, res) => {
  const u = await auth(req, res, true);
  try {
    const r = await db(
      `SELECT p.*, u.name as creator_name, u.email as creator_email,
        (SELECT COUNT(*)::int FROM votes v WHERE v.poll_id=p.id) AS total_votes,
        (SELECT COUNT(DISTINCT COALESCE(v.user_id, v.guest_email, v.id::text))::int FROM votes v WHERE v.poll_id=p.id) AS unique_participants
       FROM polls p JOIN users u ON u.id=p.creator_id WHERE p.id=$1`,
      [req.params.id]
    );
    if (!r.rows[0]) return err(res, 404, 'Poll not found');
    ok(res, formatPoll(r.rows[0]));
  } catch (e) { err(res, 500, e.message); }
});

// GET /api/polls/code/:code
app.get('/api/polls/code/:code', async (req, res) => {
  try {
    const r = await db(
      `SELECT p.*, u.name as creator_name,
        (SELECT COUNT(*)::int FROM votes v WHERE v.poll_id=p.id) AS total_votes,
        (SELECT COUNT(DISTINCT COALESCE(v.user_id, v.guest_email, v.id::text))::int FROM votes v WHERE v.poll_id=p.id) AS unique_participants
       FROM polls p JOIN users u ON u.id=p.creator_id WHERE UPPER(p.code)=UPPER($1)`,
      [req.params.code]
    );
    if (!r.rows[0]) return err(res, 404, 'Poll not found');
    ok(res, formatPoll(r.rows[0]));
  } catch (e) { err(res, 500, e.message); }
});

// POST /api/polls
app.post('/api/polls', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const { title, description, type, options = [], questions = [], matrixRows, matrixCols, settings = {}, classroomId } = req.body;
    if (!title || !type) return err(res, 400, 'Title and type required');
    let code;
    for (let i = 0; i < 5; i++) {
      code = genCode();
      const c = await db('SELECT id FROM polls WHERE code=$1', [code]);
      if (!c.rows[0]) break;
    }
    const id = uid();
    const defaultSettings = {
      allowAnonymous:true, requireLogin:false, oneResponsePerUser:true,
      showResultsLive:true, showCorrectAnswers:false, showKeySheetAfter:true,
      shuffleOptions:false, shuffleQuestions:false, preventTabSwitch:false,
      showProgressBar:true, allowReview:true,
    };
    const merged = { ...defaultSettings, ...settings };
    await db(
      `INSERT INTO polls (id,code,title,description,type,status,creator_id,options,questions,matrix_rows,matrix_cols,settings,classroom_id)
       VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$9,$10,$11,$12)`,
      [id, code, title.trim(), description||null, type, u.id,
       JSON.stringify(options), JSON.stringify(questions),
       JSON.stringify(matrixRows||[]), JSON.stringify(matrixCols||[]),
       JSON.stringify(merged), classroomId||null]
    );
    const r = await db('SELECT * FROM polls WHERE id=$1', [id]);
    ok(res, formatPoll(r.rows[0]));
  } catch (e) { err(res, 500, e.message); }
});

// PUT /api/polls/:id
app.put('/api/polls/:id', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db('SELECT * FROM polls WHERE id=$1 AND creator_id=$2', [req.params.id, u.id]);
    if (!r.rows[0]) return err(res, 404, 'Poll not found');
    const { title, description, options, questions, matrixRows, matrixCols, settings, classroomId } = req.body;
    await db(
      `UPDATE polls SET title=COALESCE($1,title), description=COALESCE($2,description),
       options=COALESCE($3,options), questions=COALESCE($4,questions),
       matrix_rows=COALESCE($5,matrix_rows),
       matrix_cols=COALESCE($6,matrix_cols), settings=COALESCE($7,settings),
       classroom_id=COALESCE($8,classroom_id), updated_at=NOW() WHERE id=$9`,
      [title||null, description||null,
       options?JSON.stringify(options):null,
       questions?JSON.stringify(questions):null,
       matrixRows?JSON.stringify(matrixRows):null,
       matrixCols?JSON.stringify(matrixCols):null,
       settings?JSON.stringify(settings):null,
       classroomId||null, req.params.id]
    );
    const updated = await db('SELECT * FROM polls WHERE id=$1', [req.params.id]);
    ok(res, formatPoll(updated.rows[0]));
  } catch (e) { err(res, 500, e.message); }
});

// DELETE /api/polls/:id
app.delete('/api/polls/:id', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    await db('DELETE FROM polls WHERE id=$1 AND creator_id=$2', [req.params.id, u.id]);
    ok(res, { message: 'Deleted' });
  } catch (e) { err(res, 500, e.message); }
});

// PATCH /api/polls/:id/status
app.patch('/api/polls/:id/status', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const { status } = req.body;
    const valid = ['draft','active','paused','closed','results_released'];
    if (!valid.includes(status)) return err(res, 400, 'Invalid status');
    const extra = status === 'closed' ? ', closed_at=NOW()' : '';
    await db(`UPDATE polls SET status=$1, updated_at=NOW()${extra} WHERE id=$2 AND creator_id=$3`,
      [status, req.params.id, u.id]);
    if (status === 'active') push(`poll-${req.params.id}`, 'poll-opened', {});
    if (status === 'closed') push(`poll-${req.params.id}`, 'poll-closed', {});
    ok(res, { message: 'Updated' });
  } catch (e) { err(res, 500, e.message); }
});

// POST /api/polls/:id/release
app.post('/api/polls/:id/release', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db('SELECT * FROM polls WHERE id=$1 AND creator_id=$2', [req.params.id, u.id]);
    if (!r.rows[0]) return err(res, 404, 'Poll not found');
    await db(`UPDATE polls SET status='results_released', results_released_at=NOW(), updated_at=NOW() WHERE id=$1`, [req.params.id]);
    // Notify all participants
    const attempts = await db(
      'SELECT DISTINCT user_id FROM attempts WHERE poll_id=$1 AND user_id IS NOT NULL',
      [req.params.id]
    );
    for (const a of attempts.rows) {
      const nid = uid();
      await db(
        `INSERT INTO notifications (id,user_id,type,title,message,link) VALUES ($1,$2,'result_released',$3,$4,$5)`,
        [nid, a.user_id, `Results released: ${r.rows[0].title}`,
         'Your teacher has released the results. View your key sheet now.',
         `/student/results`]
      );
      push(`private-user-${a.user_id}`, 'notification', {
        id:nid, type:'result_released', title:`Results released: ${r.rows[0].title}`,
        message:'View your key sheet now', link:'/student/results', isRead:false, createdAt:new Date(),
      });
    }
    ok(res, { message: 'Results released' });
  } catch (e) { err(res, 500, e.message); }
});

// POST /api/polls/:id/duplicate
app.post('/api/polls/:id/duplicate', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db('SELECT * FROM polls WHERE id=$1 AND creator_id=$2', [req.params.id, u.id]);
    if (!r.rows[0]) return err(res, 404, 'Not found');
    const p = r.rows[0];
    let code;
    for (let i = 0; i < 5; i++) {
      code = genCode();
      const c = await db('SELECT id FROM polls WHERE code=$1', [code]);
      if (!c.rows[0]) break;
    }
    const newId = uid();
    await db(
      `INSERT INTO polls (id,code,title,description,type,status,creator_id,options,matrix_rows,matrix_cols,settings)
       VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$9,$10)`,
      [newId, code, `${p.title} (copy)`, p.description, p.type, u.id,
       p.options, p.matrix_rows, p.matrix_cols, p.settings]
    );
    ok(res, { id: newId });
  } catch (e) { err(res, 500, e.message); }
});

// GET /api/polls/:id/results
app.get('/api/polls/:id/results', async (req, res) => {
  try {
    const poll = await db('SELECT * FROM polls WHERE id=$1', [req.params.id]);
    if (!poll.rows[0]) return err(res, 404, 'Poll not found');
    const p = poll.rows[0];
    const options = typeof p.options === 'string' ? JSON.parse(p.options) : p.options;

    // Get vote counts per option
    const votes = await db(
      'SELECT selected_options, text_answer, numeric_answer FROM votes WHERE poll_id=$1',
      [req.params.id]
    );

    const countMap = {};
    const words    = {};
    const numbers  = [];
    let total = 0;

    for (const v of votes.rows) {
      const sel = typeof v.selected_options === 'string' ? JSON.parse(v.selected_options) : (v.selected_options || []);
      sel.forEach(id => { countMap[id] = (countMap[id]||0) + 1; total++; });
      if (v.text_answer) {
        v.text_answer.trim().split(/\s+/).forEach(w => { words[w.toLowerCase()] = (words[w.toLowerCase()]||0) + 1; });
      }
      if (v.numeric_answer !== null && v.numeric_answer !== undefined) {
        numbers.push(Number(v.numeric_answer));
      }
    }

    const optionStats = options.map(opt => ({
      id: opt.id, text: opt.text,
      count: countMap[opt.id] || 0,
      percentage: total > 0 ? Math.round(((countMap[opt.id]||0)/total)*100) : 0,
    }));

    const wordList = Object.entries(words).map(([text,count]) => ({ text, count }))
      .sort((a,b) => b.count-a.count).slice(0,50);

    const average = numbers.length > 0 ? numbers.reduce((a,b)=>a+b,0)/numbers.length : null;

    // Distribution for NPS/slider
    const distribution = {};
    numbers.forEach(n => { distribution[Math.round(n)] = (distribution[Math.round(n)]||0) + 1; });

    // Q&A questions
    const qa = await db('SELECT * FROM qa_items WHERE poll_id=$1 AND status=\'approved\' ORDER BY upvotes DESC LIMIT 20', [req.params.id]);
    const questions = qa.rows.map(q => ({ text:q.text, author:q.author_name, upvotes:q.upvotes, answered:q.answered }));

    // Quiz leaderboard from attempts
    const attempts = await db(
      `SELECT a.*, u.name as user_name FROM attempts a
       LEFT JOIN users u ON u.id=a.user_id
       WHERE a.poll_id=$1 AND a.status='submitted' AND a.percentage IS NOT NULL
       ORDER BY a.percentage DESC, a.time_taken ASC LIMIT 20`,
      [req.params.id]
    );
    const leaderboard = attempts.rows.map((a,i) => ({
      rank: i+1, name: a.user_name || a.guest_name || 'Anonymous',
      score: Math.round(a.percentage), timeTaken: a.time_taken || 0,
    }));

    ok(res, { optionStats, words: wordList, questions, leaderboard, average, distribution, total });
  } catch (e) { err(res, 500, e.message); }
});

// GET /api/polls/:id/analytics
app.get('/api/polls/:id/analytics', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const poll = await db('SELECT * FROM polls WHERE id=$1', [req.params.id]);
    if (!poll.rows[0]) return err(res, 404, 'Poll not found');

    const attemptsR = await db(
      `SELECT a.*, u.name as user_name FROM attempts a
       LEFT JOIN users u ON u.id=a.user_id
       WHERE a.poll_id=$1 ORDER BY a.created_at DESC`,
      [req.params.id]
    );
    const all = attemptsR.rows;
    const completed = all.filter(a => a.status === 'submitted');
    const withScore = completed.filter(a => a.percentage !== null);

    const avgScore  = withScore.length ? withScore.reduce((s,a)=>s+Number(a.percentage),0)/withScore.length : null;
    const passRate  = withScore.length ? (withScore.filter(a=>a.passed).length/withScore.length)*100 : null;
    const avgTime   = completed.filter(a=>a.time_taken).reduce((s,a)=>s+a.time_taken,0) / Math.max(1,completed.filter(a=>a.time_taken).length);

    const scoreRanges = {'0-20':0,'21-40':0,'41-60':0,'61-80':0,'81-100':0};
    withScore.forEach(a => {
      const p = Number(a.percentage);
      if(p<=20)scoreRanges['0-20']++;
      else if(p<=40)scoreRanges['21-40']++;
      else if(p<=60)scoreRanges['41-60']++;
      else if(p<=80)scoreRanges['61-80']++;
      else scoreRanges['81-100']++;
    });
    const scoreDistribution = Object.entries(scoreRanges).map(([range,count])=>({range,count}));

    const topStudents = withScore.sort((a,b)=>b.percentage-a.percentage).slice(0,10).map((a,i)=>({
      rank:i+1, name:a.user_name||a.guest_name||'Anonymous', score:Math.round(a.percentage)
    }));

    // Option stats from votes
    const options = typeof poll.rows[0].options === 'string' ? JSON.parse(poll.rows[0].options) : poll.rows[0].options;
    const votes = await db('SELECT selected_options FROM votes WHERE poll_id=$1', [req.params.id]);
    const countMap = {};
    let vTotal = 0;
    for(const v of votes.rows){
      const sel = typeof v.selected_options === 'string' ? JSON.parse(v.selected_options) : (v.selected_options||[]);
      sel.forEach(id=>{countMap[id]=(countMap[id]||0)+1; vTotal++;});
    }
    const optionStats = options.map(o=>({
      optionId:o.id, text:o.text,
      count:countMap[o.id]||0,
      percentage:vTotal>0?Math.round(((countMap[o.id]||0)/vTotal)*100):0,
    }));

    ok(res, {
      pollId: req.params.id, poll: formatPoll(poll.rows[0]),
      totalAttempts: all.length, completedAttempts: completed.length,
      averageScore: avgScore ? Math.round(avgScore) : null,
      averageTimeSecs: Math.round(avgTime) || null,
      passRate: passRate ? Math.round(passRate) : null,
      optionStats, scoreDistribution, topStudents,
    });
  } catch (e) { err(res, 500, e.message); }
});

// ── VOTING (non-quiz) ─────────────────────────────────────────────────────────
app.post('/api/polls/:id/vote', async (req, res) => {
  const u = await auth(req, res, true);
  try {
    const poll = await db('SELECT * FROM polls WHERE id=$1', [req.params.id]);
    if (!poll.rows[0]) return err(res, 404, 'Poll not found');
    const p = poll.rows[0];
    if (p.status !== 'active') return err(res, 400, 'Poll is not active');
    const settings = typeof p.settings === 'string' ? JSON.parse(p.settings) : p.settings;

    // Check duplicate
    if (settings.oneResponsePerUser && u) {
      const dup = await db('SELECT id FROM votes WHERE poll_id=$1 AND user_id=$2', [p.id, u.id]);
      if (dup.rows[0]) return err(res, 409, 'Already voted');
    }

    const { selectedOptions=[], textAnswer, numericAnswer, rankingOrder, matrixAnswers, heatmapX, heatmapY } = req.body;
    const vid = uid();
    await db(
      `INSERT INTO votes (id,poll_id,user_id,guest_name,guest_email,selected_options,text_answer,numeric_answer,ranking_order,matrix_answers,heatmap_x,heatmap_y)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [vid, p.id, u?.id||null, req.body.guestName||null, req.body.guestEmail||null,
       JSON.stringify(selectedOptions), textAnswer||null, numericAnswer??null,
       rankingOrder?JSON.stringify(rankingOrder):null,
       matrixAnswers?JSON.stringify(matrixAnswers):null,
       heatmapX??null, heatmapY??null]
    );

    push(`poll-${p.id}`, 'new-vote', { pollId: p.id });
    ok(res, { message: 'Vote recorded', voteId: vid });
  } catch (e) { err(res, 500, e.message); }
});

// ── ATTEMPTS ──────────────────────────────────────────────────────────────────

// POST /api/polls/:id/attempts/start
app.post('/api/polls/:id/attempts/start', async (req, res) => {
  const u = await auth(req, res, true);
  try {
    const poll = await db('SELECT * FROM polls WHERE id=$1', [req.params.id]);
    if (!poll.rows[0]) return err(res, 404, 'Poll not found');
    const p = poll.rows[0];
    if (p.status !== 'active') return err(res, 400, 'Poll is not active');

    const id = uid();
    const { guestName, guestEmail } = req.body;
    await db(
      `INSERT INTO attempts (id,poll_id,user_id,guest_name,guest_email,status)
       VALUES ($1,$2,$3,$4,$5,'in_progress')`,
      [id, p.id, u?.id||null, guestName||null, guestEmail||null]
    );

    push(`poll-${p.id}`, 'new-attempt', { pollId: p.id });
    ok(res, { id, pollId: p.id, status: 'in_progress', startedAt: new Date() });
  } catch (e) { err(res, 500, e.message); }
});

// PATCH /api/attempts/:id/save  (autosave)
app.patch('/api/attempts/:id/save', async (req, res) => {
  try {
    await db('UPDATE attempts SET answers_draft=$1, updated_at=NOW() WHERE id=$2',
      [JSON.stringify(req.body), req.params.id]);
    ok(res, { message: 'Saved' });
  } catch (e) { err(res, 500, e.message); }
});

// POST /api/attempts/:id/submit
app.post('/api/attempts/:id/submit', async (req, res) => {
  const u = await auth(req, res, true);
  try {
    const aR = await db('SELECT a.*, p.options, p.questions, p.settings, p.type FROM attempts a JOIN polls p ON p.id=a.poll_id WHERE a.id=$1', [req.params.id]);
    if (!aR.rows[0]) return err(res, 404, 'Attempt not found');
    const a = aR.rows[0];
    if (a.status === 'submitted') return err(res, 409, 'Already submitted');

    const options   = typeof a.options   === 'string' ? JSON.parse(a.options   || '[]') : (a.options  || []);
    const questions = typeof a.questions === 'string' ? JSON.parse(a.questions || '[]') : (a.questions || []);
    const settings  = typeof a.settings  === 'string' ? JSON.parse(a.settings  || '{}') : (a.settings || {});
    const { selectedOptions=[], textAnswer, numericAnswer, rankingOrder, matrixAnswers, heatmapX, heatmapY, timeTaken, allAnswers } = req.body;

    const QUIZ_TYPES = ['quiz','multiple_choice','true_false','image_choice','fill_blank','matching'];
    let score = 0, maxScore = 0, isCorrect = false;
    const detailedAnswers = [];

    const gradeQuestion = (qDef, qSelected=[], qText='') => {
      const qType = qDef.type || a.type;
      const qOpts = qDef.options || [];
      let qScore = 0, qMax = 0;

      if (['quiz','multiple_choice','true_false','image_choice'].includes(qType) && qOpts.length > 0) {
        const correct = qOpts.filter(o=>o.isCorrect).map(o=>o.id);
        qMax = qOpts.filter(o=>o.isCorrect).reduce((s,o)=>s+(o.points||1), 0) || qOpts.filter(o=>o.isCorrect).length || 1;
        const earned = qOpts.filter(o=>o.isCorrect && qSelected.includes(o.id));
        qScore = earned.reduce((s,o)=>s+(o.points||1), 0);
        if (settings.negativeMarking || settings.penaltyForWrong) {
          const wrong = qSelected.filter(id=>!correct.includes(id)).length;
          const penalty = settings.penaltyPoints || settings.penaltyForWrong || 0.25;
          qScore = Math.max(0, qScore - wrong * penalty);
        }
      } else if (qType === 'fill_blank') {
        qMax = qDef.points || 1;
        const fillCorrect = (qDef.fillBlankAnswer || '').trim();
        const fillGiven   = (qText || '').trim();
        const match = settings.caseSensitive
          ? fillGiven === fillCorrect
          : fillGiven.toLowerCase() === fillCorrect.toLowerCase();
        if (match && fillCorrect) qScore = qMax;
      } else if (qType === 'matching') {
        qMax = qDef.points || (qDef.matchPairs?.length || 1);
        qScore = qSelected.length >= (qDef.matchPairs?.length || 1) ? qMax : 0;
      } else {
        qMax = 0; qScore = 0;
      }

      const correctAnswer = qOpts.filter(o=>o.isCorrect).map(o=>o.text).join(', ')
        || qDef.fillBlankAnswer || '';
      const yourAnswer = qOpts.filter(o=>qSelected.includes(o.id)).map(o=>o.text).join(', ')
        || qText || '';

      return {
        questionId: qDef.id || qDef.type,
        questionTitle: qDef.title || qDef.question || '',
        questionType: qType,
        selectedOptions: qSelected,
        textAnswer: qText,
        yourAnswer,
        correctAnswer,
        isCorrect: qMax > 0 && qScore >= qMax,
        isPartial: qMax > 0 && qScore > 0 && qScore < qMax,
        pointsEarned: qScore,
        maxPoints: qMax,
        explanation: qDef.explanation,
      };
    };

    // ── Multi-question quiz grading ──────────────────────────────────────────
    const isMultiQ = questions.length > 1;
    if (isMultiQ && allAnswers && QUIZ_TYPES.includes(a.type)) {
      for (let qi = 0; qi < questions.length; qi++) {
        const qDef = questions[qi];
        const ans  = allAnswers[qi] || {};
        const qResult = gradeQuestion(qDef, ans.selected || [], ans.text || '');
        score    += qResult.pointsEarned;
        maxScore += qResult.maxPoints;
        detailedAnswers.push(qResult);
      }
      isCorrect = maxScore > 0 && score >= maxScore;
    } else if (QUIZ_TYPES.includes(a.type) && options.length > 0) {
      // Single question grading
      const qDef = questions[0] || { type: a.type, options, title: '' };
      const qResult = gradeQuestion(qDef, selectedOptions, textAnswer || '');
      score    = qResult.pointsEarned;
      maxScore = qResult.maxPoints;
      isCorrect = qResult.isCorrect;
      detailedAnswers.push(qResult);
    }

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : null;
    const passed = settings.passingScore && percentage !== null
      ? percentage >= Number(settings.passingScore) : null;

    await db(
      `UPDATE attempts SET status='submitted', score=$1, max_score=$2, percentage=$3, passed=$4,
       time_taken=$5, submitted_at=NOW(), answers=$6, updated_at=NOW() WHERE id=$7`,
      [score, maxScore || null, percentage, passed, timeTaken || null,
       JSON.stringify(detailedAnswers.length ? detailedAnswers : [{ selectedOptions, textAnswer, numericAnswer, rankingOrder, matrixAnswers, heatmapX, heatmapY, isCorrect, pointsEarned: score }]),
       req.params.id]
    );

    // Also insert as a vote for live results
    const vid = uid();
    await db(
      `INSERT INTO votes (id,poll_id,user_id,guest_name,guest_email,selected_options,text_answer,numeric_answer,ranking_order,matrix_answers,heatmap_x,heatmap_y)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [vid, a.poll_id, a.user_id, a.guest_name, a.guest_email,
       JSON.stringify(selectedOptions), textAnswer||null, numericAnswer??null,
       rankingOrder?JSON.stringify(rankingOrder):null,
       matrixAnswers?JSON.stringify(matrixAnswers):null,
       heatmapX??null, heatmapY??null]
    );

    push(`poll-${a.poll_id}`, 'new-vote', { pollId: a.poll_id });
    ok(res, { id:req.params.id, score, maxScore, percentage, passed, isCorrect });
  } catch (e) { err(res, 500, e.message); }
});

// GET /api/attempts/:id
app.get('/api/attempts/:id', async (req, res) => {
  try {
    const r = await db('SELECT a.*, p.title as poll_title, p.type as poll_type FROM attempts a JOIN polls p ON p.id=a.poll_id WHERE a.id=$1', [req.params.id]);
    if (!r.rows[0]) return err(res, 404, 'Not found');
    ok(res, formatAttempt(r.rows[0]));
  } catch (e) { err(res, 500, e.message); }
});

// GET /api/attempts/mine
app.get('/api/attempts/mine', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db(
      `SELECT a.*, p.title as poll_title, p.type as poll_type, p.status as poll_status
       FROM attempts a JOIN polls p ON p.id=a.poll_id
       WHERE a.user_id=$1 ORDER BY a.created_at DESC`,
      [u.id]
    );
    ok(res, r.rows.map(formatAttempt));
  } catch (e) { err(res, 500, e.message); }
});

// GET /api/polls/:id/attempts
app.get('/api/polls/:id/attempts', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM attempts a LEFT JOIN users u ON u.id=a.user_id
       WHERE a.poll_id=$1 ORDER BY a.created_at DESC`,
      [req.params.id]
    );
    ok(res, r.rows.map(a => ({
      ...formatAttempt(a),
      user: a.user_name ? { name:a.user_name, email:a.user_email } : null,
    })));
  } catch (e) { err(res, 500, e.message); }
});

// GET /api/attempts/:id/keysheet
app.get('/api/attempts/:id/keysheet', async (req, res) => {
  const u = await auth(req, res, true);
  try {
    const r = await db(
      `SELECT a.*, p.title as poll_title, p.description as poll_desc,
              p.options as poll_options, p.questions as poll_questions,
              p.type as poll_type, p.settings as poll_settings,
              p.status as poll_status, u.name as user_name, u.email as user_email
       FROM attempts a
       JOIN polls p ON p.id=a.poll_id
       LEFT JOIN users u ON u.id=a.user_id
       WHERE a.id=$1`,
      [req.params.id]
    );
    if (!r.rows[0]) return err(res, 404, 'Attempt not found');
    const a = r.rows[0];

    // Check if results released or requester is teacher/creator
    if (a.poll_status !== 'results_released') {
      if (!u) return err(res, 403, 'Results not yet released by your teacher');
      const pollOwner = await db('SELECT creator_id FROM polls WHERE id=$1', [a.poll_id]);
      if (pollOwner.rows[0]?.creator_id !== u.id) return err(res, 403, 'Results not yet released');
    }

    const options   = typeof a.poll_options   === 'string' ? JSON.parse(a.poll_options   || '[]') : (a.poll_options  || []);
    const questions = typeof a.poll_questions === 'string' ? JSON.parse(a.poll_questions || '[]') : (a.poll_questions || []);
    const settings  = typeof a.poll_settings  === 'string' ? JSON.parse(a.poll_settings  || '{}') : (a.poll_settings || {});
    const rawAns    = typeof a.answers        === 'string' ? JSON.parse(a.answers         || '[]') : (a.answers       || []);

    let answerBreakdown = [];

    // Check if answers are already in detailed per-question format (new multi-Q format)
    const isDetailedFormat = rawAns.length > 0 && rawAns[0]?.questionId !== undefined;

    if (isDetailedFormat) {
      // New format: answers array has full per-question breakdown
      answerBreakdown = rawAns.map((ans, i) => ({
        questionId:    ans.questionId || String(i),
        questionTitle: ans.questionTitle || `Question ${i + 1}`,
        questionType:  ans.questionType || a.poll_type,
        yourAnswer:    ans.yourAnswer || ans.textAnswer || (ans.selectedOptions || []).join(', ') || '(no answer)',
        correctAnswer: ans.correctAnswer || '',
        isCorrect:     Boolean(ans.isCorrect),
        isPartial:     Boolean(ans.isPartial),
        pointsEarned:  Number(ans.pointsEarned || 0),
        maxPoints:     Number(ans.maxPoints || 0),
        explanation:   ans.explanation || null,
        timeTaken:     null,
      }));
    } else if (questions.length > 1) {
      // Multi-Q poll but old answer format — build breakdown from questions
      const answersMap = rawAns.reduce((m, ans, i) => { m[i] = ans; return m; }, {});
      answerBreakdown = questions.map((q, i) => {
        const ans      = answersMap[i] || rawAns[0] || {};
        const qOpts    = q.options || [];
        const qSel     = ans.selectedOptions || ans.selected || [];
        const yours    = qOpts.filter(o => qSel.includes(o.id)).map(o => o.text).join(', ') || ans.textAnswer || ans.text || '(no answer)';
        const correct  = qOpts.filter(o => o.isCorrect).map(o => o.text).join(', ') || q.fillBlankAnswer || '';
        const isOk     = qOpts.length > 0
          ? qOpts.filter(o=>o.isCorrect).every(o=>qSel.includes(o.id)) && qSel.every(id=>qOpts.find(o=>o.id===id)?.isCorrect)
          : false;
        return {
          questionId: q.id || String(i),
          questionTitle: q.title || `Question ${i + 1}`,
          questionType:  q.type || a.poll_type,
          yourAnswer:    yours,
          correctAnswer: correct,
          isCorrect:     isOk,
          isPartial:     false,
          pointsEarned:  isOk ? (q.points || 1) : 0,
          maxPoints:     q.points || 1,
          explanation:   q.explanation || null,
          timeTaken:     null,
        };
      });
    } else {
      // Single question legacy format
      const ans      = rawAns[0] || {};
      const selected = ans.selectedOptions || ans.selected || [];
      answerBreakdown = options
        .filter(opt => opt.isCorrect || selected.includes(opt.id))
        .map(opt => ({
          questionId:    opt.id,
          questionTitle: a.poll_title,
          questionType:  a.poll_type,
          yourAnswer:    selected.includes(opt.id) ? opt.text : '',
          correctAnswer: opt.isCorrect ? opt.text : '',
          isCorrect:     Boolean(selected.includes(opt.id) && opt.isCorrect),
          isPartial:     false,
          pointsEarned:  (selected.includes(opt.id) && opt.isCorrect) ? Number(opt.points || 1) : 0,
          maxPoints:     opt.isCorrect ? Number(opt.points || 1) : 0,
          explanation:   opt.explanation || null,
          timeTaken:     a.time_taken,
        }));

      // If no option breakdown, add single summary row
      if (answerBreakdown.length === 0) {
        answerBreakdown = [{
          questionId:    'q1',
          questionTitle: a.poll_title,
          questionType:  a.poll_type,
          yourAnswer:    ans.textAnswer || selected.join(', ') || '(no answer)',
          correctAnswer: options.filter(o=>o.isCorrect).map(o=>o.text).join(', ') || '',
          isCorrect:     Boolean(ans.isCorrect),
          isPartial:     false,
          pointsEarned:  Number(a.score || 0),
          maxPoints:     Number(a.max_score || 0),
          explanation:   null,
          timeTaken:     a.time_taken,
        }];
      }
    }

    ok(res, {
      attempt: {
        id:          a.id,
        status:      a.status,
        score:       Number(a.score || 0),
        maxScore:    Number(a.max_score || 0),
        percentage:  Number(a.percentage || 0),
        passed:      Boolean(a.passed),
        timeTaken:   a.time_taken,
        submittedAt: a.submitted_at,
        user:        a.user_name ? { name: a.user_name, email: a.user_email } : null,
        guestName:   a.guest_name,
        poll: { title: a.poll_title, description: a.poll_desc, settings },
      },
      answers: answerBreakdown,
    });
  } catch (e) { err(res, 500, e.message); }
});

// ── CLASSROOMS ────────────────────────────────────────────────────────────────
app.get('/api/classrooms', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    let r;
    if (u.role === 'teacher' || u.role === 'admin') {
      r = await db(
        `SELECT c.*,
          (SELECT COUNT(*)::int FROM classroom_students cs WHERE cs.classroom_id=c.id) AS student_count,
          (SELECT COUNT(*)::int FROM polls p WHERE p.classroom_id=c.id) AS poll_count
         FROM classrooms c WHERE c.teacher_id=$1 ORDER BY c.created_at DESC`,
        [u.id]
      );
    } else {
      r = await db(
        `SELECT c.*,
          (SELECT COUNT(*)::int FROM classroom_students cs WHERE cs.classroom_id=c.id) AS student_count,
          (SELECT COUNT(*)::int FROM polls p WHERE p.classroom_id=c.id) AS poll_count
         FROM classrooms c JOIN classroom_students cs ON cs.classroom_id=c.id
         WHERE cs.user_id=$1 ORDER BY c.created_at DESC`,
        [u.id]
      );
    }
    ok(res, r.rows.map(c => ({
      id:c.id, name:c.name, description:c.description, code:c.code,
      inviteCode: c.code,            // alias for UI
      subject: c.subject ?? null,
      teacherId:c.teacher_id, studentCount:c.student_count, pollCount:c.poll_count,
      avgScore: c.avg_score ?? null,
      createdAt:c.created_at,
    })));
  } catch (e) { err(res, 500, e.message); }
});

app.get('/api/classrooms/:id', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db(
      `SELECT c.*,
        (SELECT COUNT(*)::int FROM classroom_students cs WHERE cs.classroom_id=c.id) AS student_count,
        (SELECT COUNT(*)::int FROM polls p WHERE p.classroom_id=c.id) AS poll_count
       FROM classrooms c WHERE c.id=$1`,
      [req.params.id]
    );
    if (!r.rows[0]) return err(res, 404, 'Classroom not found');
    const c = r.rows[0];
    ok(res, { id:c.id, name:c.name, description:c.description, subject:c.subject??null,
      code:c.code, inviteCode:c.code,
      teacherId:c.teacher_id, studentCount:c.student_count, pollCount:c.poll_count, createdAt:c.created_at });
  } catch (e) { err(res, 500, e.message); }
});

app.post('/api/classrooms', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const { name, description, subject } = req.body;
    if (!name) return err(res, 400, 'Name required');
    const id = uid(); let code;
    for(let i=0;i<5;i++){ code=genCode(6); const c=await db('SELECT id FROM classrooms WHERE code=$1',[code]); if(!c.rows[0])break; }
    await db('INSERT INTO classrooms (id,name,description,subject,code,teacher_id) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, name.trim(), description||null, subject||null, code, u.id]);
    ok(res, { id, name, description, subject:subject||null, code, inviteCode:code, teacherId:u.id, studentCount:0, pollCount:0, createdAt:new Date() });
  } catch (e) { err(res, 500, e.message); }
});

app.put('/api/classrooms/:id', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const { name, description } = req.body;
    await db('UPDATE classrooms SET name=COALESCE($1,name),description=COALESCE($2,description),updated_at=NOW() WHERE id=$3 AND teacher_id=$4',
      [name||null, description||null, req.params.id, u.id]);
    ok(res, { message: 'Updated' });
  } catch (e) { err(res, 500, e.message); }
});

app.delete('/api/classrooms/:id', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    await db('DELETE FROM classrooms WHERE id=$1 AND teacher_id=$2', [req.params.id, u.id]);
    ok(res, { message: 'Deleted' });
  } catch (e) { err(res, 500, e.message); }
});

app.post('/api/classrooms/join', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const { code } = req.body;
    const r = await db('SELECT * FROM classrooms WHERE UPPER(code)=UPPER($1)', [code]);
    if (!r.rows[0]) return err(res, 404, 'Classroom not found');
    const c = r.rows[0];
    const dup = await db('SELECT id FROM classroom_students WHERE classroom_id=$1 AND user_id=$2', [c.id, u.id]);
    if (dup.rows[0]) return err(res, 409, 'Already joined');
    await db('INSERT INTO classroom_students (classroom_id,user_id) VALUES ($1,$2)', [c.id, u.id]);
    ok(res, { message: 'Joined', classroom: { id:c.id, name:c.name } });
  } catch (e) { err(res, 500, e.message); }
});

app.post('/api/classrooms/:id/leave', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    await db('DELETE FROM classroom_students WHERE classroom_id=$1 AND user_id=$2', [req.params.id, u.id]);
    ok(res, { message: 'Left' });
  } catch (e) { err(res, 500, e.message); }
});

app.get('/api/classrooms/:id/students', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db(
      `SELECT u.id,u.name,u.email,u.created_at FROM users u
       JOIN classroom_students cs ON cs.user_id=u.id WHERE cs.classroom_id=$1 ORDER BY u.name`,
      [req.params.id]
    );
    ok(res, r.rows.map(s => ({ id:s.id, name:s.name, email:s.email, createdAt:s.created_at })));
  } catch (e) { err(res, 500, e.message); }
});

app.delete('/api/classrooms/:id/students/:userId', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    await db('DELETE FROM classroom_students WHERE classroom_id=$1 AND user_id=$2', [req.params.id, req.params.userId]);
    ok(res, { message: 'Removed' });
  } catch (e) { err(res, 500, e.message); }
});

app.get('/api/classrooms/:id/polls', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db(
      `SELECT p.*,
        (SELECT COUNT(*)::int FROM votes v WHERE v.poll_id=p.id) AS total_votes,
        (SELECT COUNT(DISTINCT COALESCE(v.user_id,v.guest_email,v.id::text))::int FROM votes v WHERE v.poll_id=p.id) AS unique_participants
       FROM polls p WHERE p.classroom_id=$1 ORDER BY p.created_at DESC`,
      [req.params.id]
    );
    ok(res, r.rows.map(formatPoll));
  } catch (e) { err(res, 500, e.message); }
});

app.get('/api/classrooms/:id/results', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db(
      `SELECT a.*, u.name as user_name, p.title as poll_title, p.type as poll_type
       FROM attempts a
       JOIN polls p ON p.id=a.poll_id AND p.classroom_id=$1
       LEFT JOIN users u ON u.id=a.user_id
       ORDER BY a.created_at DESC LIMIT 100`,
      [req.params.id]
    );
    ok(res, r.rows.map(a => ({
      ...formatAttempt(a),
      user: a.user_name ? { name:a.user_name } : null,
      poll: { title:a.poll_title, type:a.poll_type },
    })));
  } catch (e) { err(res, 500, e.message); }
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
app.get('/api/notifications', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [u.id]);
    ok(res, r.rows.map(n=>({ id:n.id, type:n.type, title:n.title, message:n.message,
      link:n.link, isRead:n.is_read, createdAt:n.created_at, data:n.data })));
  } catch (e) { err(res, 500, e.message); }
});

app.get('/api/notifications/unread-count', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db('SELECT COUNT(*)::int as count FROM notifications WHERE user_id=$1 AND is_read=false', [u.id]);
    ok(res, { count: r.rows[0].count });
  } catch (e) { err(res, 500, e.message); }
});

app.patch('/api/notifications/:id/read', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    await db('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, u.id]);
    ok(res, { message: 'Marked read' });
  } catch (e) { err(res, 500, e.message); }
});

app.patch('/api/notifications/read-all', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    await db('UPDATE notifications SET is_read=true WHERE user_id=$1', [u.id]);
    ok(res, { message: 'All read' });
  } catch (e) { err(res, 500, e.message); }
});

app.delete('/api/notifications/:id', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    await db('DELETE FROM notifications WHERE id=$1 AND user_id=$2', [req.params.id, u.id]);
    ok(res, { message: 'Deleted' });
  } catch (e) { err(res, 500, e.message); }
});

// ── Q&A ───────────────────────────────────────────────────────────────────────
app.get('/api/polls/:id/qa', async (req, res) => {
  try {
    const r = await db('SELECT * FROM qa_items WHERE poll_id=$1 AND status=\'approved\' ORDER BY upvotes DESC, created_at ASC', [req.params.id]);
    ok(res, r.rows.map(q=>({ id:q.id, text:q.text, authorName:q.author_name, upvotes:q.upvotes, answered:q.answered, answer:q.answer })));
  } catch (e) { err(res, 500, e.message); }
});

app.post('/api/polls/:id/qa', async (req, res) => {
  const u = await auth(req, res, true);
  try {
    const { text } = req.body;
    if (!text?.trim()) return err(res, 400, 'Question text required');
    const id = uid();
    await db('INSERT INTO qa_items (id,poll_id,text,author_name,author_user_id,status) VALUES ($1,$2,$3,$4,$5,\'approved\')',
      [id, req.params.id, text.trim(), u?.name||req.body.guestName||'Anonymous', u?.id||null]);
    push(`poll-${req.params.id}`, 'new-question', { id, text:text.trim(), authorName:u?.name||'Anonymous', upvotes:0 });
    ok(res, { id, message: 'Question submitted' });
  } catch (e) { err(res, 500, e.message); }
});

app.post('/api/qa/:id/upvote', async (req, res) => {
  try {
    await db('UPDATE qa_items SET upvotes=upvotes+1 WHERE id=$1', [req.params.id]);
    const r = await db('SELECT * FROM qa_items WHERE id=$1', [req.params.id]);
    push(`poll-${r.rows[0]?.poll_id}`, 'question-upvoted', { id:req.params.id, upvotes:r.rows[0]?.upvotes });
    ok(res, { message: 'Upvoted' });
  } catch (e) { err(res, 500, e.message); }
});

app.patch('/api/qa/:id/moderate', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const { action } = req.body; // approve | reject | archive
    await db('UPDATE qa_items SET status=$1 WHERE id=$2', [action, req.params.id]);
    ok(res, { message: 'Updated' });
  } catch (e) { err(res, 500, e.message); }
});

// ── TEMPLATES ─────────────────────────────────────────────────────────────────
app.get('/api/templates', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db('SELECT t.*, p.title, p.type FROM templates t JOIN polls p ON p.id=t.poll_id WHERE t.user_id=$1 ORDER BY t.created_at DESC', [u.id]);
    ok(res, r.rows.map(t=>({ id:t.id, pollId:t.poll_id, title:t.title, type:t.type, createdAt:t.created_at })));
  } catch (e) { err(res, 500, e.message); }
});

app.post('/api/templates', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const { pollId } = req.body;
    const id = uid();
    await db('INSERT INTO templates (id,user_id,poll_id) VALUES ($1,$2,$3)', [id, u.id, pollId]);
    ok(res, { id, message: 'Saved as template' });
  } catch (e) { err(res, 500, e.message); }
});

app.delete('/api/templates/:id', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    await db('DELETE FROM templates WHERE id=$1 AND user_id=$2', [req.params.id, u.id]);
    ok(res, { message: 'Deleted' });
  } catch (e) { err(res, 500, e.message); }
});

// ── ANALYTICS (global) ────────────────────────────────────────────────────────
app.get('/api/analytics/overview', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const polls    = await db('SELECT COUNT(*)::int as n FROM polls WHERE creator_id=$1', [u.id]);
    const attempts = await db('SELECT COUNT(*)::int as n FROM attempts a JOIN polls p ON p.id=a.poll_id WHERE p.creator_id=$1', [u.id]);
    const parts    = await db('SELECT COUNT(DISTINCT COALESCE(a.user_id,a.guest_email,a.id))::int as n FROM attempts a JOIN polls p ON p.id=a.poll_id WHERE p.creator_id=$1 AND a.status=\'submitted\'', [u.id]);
    const avgR     = await db('SELECT AVG(a.percentage)::float as avg FROM attempts a JOIN polls p ON p.id=a.poll_id WHERE p.creator_id=$1 AND a.percentage IS NOT NULL', [u.id]);
    const byType   = await db('SELECT type, COUNT(*)::int as count FROM polls WHERE creator_id=$1 GROUP BY type ORDER BY count DESC', [u.id]);
    const activity = await db(
      `SELECT TO_CHAR(a.created_at,'Dy') as day, COUNT(*)::int as attempts
       FROM attempts a JOIN polls p ON p.id=a.poll_id
       WHERE p.creator_id=$1 AND a.created_at > NOW() - INTERVAL '7 days'
       GROUP BY TO_CHAR(a.created_at,'Dy'), DATE_TRUNC('day',a.created_at)
       ORDER BY DATE_TRUNC('day',a.created_at)`,
      [u.id]
    );
    const topPolls = await db(
      `SELECT p.title, COUNT(a.id)::int as attempts, AVG(a.percentage)::float as avg_score
       FROM polls p LEFT JOIN attempts a ON a.poll_id=p.id AND a.status='submitted'
       WHERE p.creator_id=$1 GROUP BY p.id,p.title ORDER BY attempts DESC LIMIT 5`,
      [u.id]
    );
    const scoreDist = await db(
      `SELECT
        COUNT(CASE WHEN percentage BETWEEN 0  AND 20 THEN 1 END)::int as r0,
        COUNT(CASE WHEN percentage BETWEEN 21 AND 40 THEN 1 END)::int as r1,
        COUNT(CASE WHEN percentage BETWEEN 41 AND 60 THEN 1 END)::int as r2,
        COUNT(CASE WHEN percentage BETWEEN 61 AND 80 THEN 1 END)::int as r3,
        COUNT(CASE WHEN percentage BETWEEN 81 AND 100 THEN 1 END)::int as r4
       FROM attempts a JOIN polls p ON p.id=a.poll_id WHERE p.creator_id=$1 AND a.percentage IS NOT NULL`,
      [u.id]
    );
    const sd = scoreDist.rows[0];
    ok(res, {
      totalPolls:polls.rows[0].n, totalAttempts:attempts.rows[0].n,
      totalParticipants:parts.rows[0].n, avgScore:Math.round(avgR.rows[0].avg||0),
      pollsByType: byType.rows.map(r=>({type:r.type, count:r.count})),
      activityByDay: activity.rows.map(r=>({day:r.day, attempts:r.attempts})),
      topPolls: topPolls.rows.map(r=>({title:r.title, attempts:r.attempts, avgScore:Math.round(r.avg_score||0)})),
      scoreDistribution:[
        {range:'0-20',count:sd.r0},{range:'21-40',count:sd.r1},{range:'41-60',count:sd.r2},
        {range:'61-80',count:sd.r3},{range:'81-100',count:sd.r4},
      ],
      leaderboard: [],
    });
  } catch (e) { err(res, 500, e.message); }
});

// ── Pusher auth ───────────────────────────────────────────────────────────────
app.post('/api/pusher/auth', async (req, res) => {
  const u = await auth(req, res, true);
  if (!pusher) return err(res, 500, 'Pusher not configured');
  try {
    const { socket_id, channel_name } = req.body;
    if (channel_name.startsWith('private-user-') && u) {
      if (!channel_name.includes(u.id)) return err(res, 403, 'Forbidden');
    }
    const auth = pusher.authorizeChannel(socket_id, channel_name, u ? { user_id:u.id, user_info:{name:u.name} } : null);
    ok(res, auth);
  } catch (e) { err(res, 500, e.message); }
});


// ── Tab-switch alert (student → teacher) ──────────────────────────────────────
app.post('/api/polls/:id/tab-switch', async (req, res) => {
  try {
    const { studentName, studentEmail, switchCount, severity } = req.body;
    const poll = await db('SELECT creator_id, title FROM polls WHERE id=$1', [req.params.id]);
    if (!poll.rows[0]) return err(res, 404, 'Poll not found');

    // Notify the poll creator (teacher) via Pusher
    if (pusher) {
      await push(`poll-${req.params.id}`, 'tab-switch', {
        studentName, studentEmail, switchCount, severity,
        pollTitle: poll.rows[0].title, pollId: req.params.id,
      });
      // Also notify teacher's private channel if they are logged in
      await push(`private-user-${poll.rows[0].creator_id}`, 'tab-switch-alert', {
        studentName, studentEmail, switchCount, severity,
        pollTitle: poll.rows[0].title, pollId: req.params.id,
      });
    }

    // Store in DB for moderation log
    const nid = uid();
    await db(
      `INSERT INTO notifications (id,user_id,type,title,message,link,data)
       VALUES ($1,$2,'announcement',$3,$4,$5,$6)`,
      [nid, poll.rows[0].creator_id,
       `⚠️ Tab Switch: ${studentName}`,
       `${studentName} switched tabs ${switchCount}× during "${poll.rows[0].title}"`,
       `/moderation`,
       JSON.stringify({ pollId: req.params.id, studentName, studentEmail, switchCount, severity })
      ]
    ).catch(() => {});

    ok(res, { message: 'Alert sent to teacher' });
  } catch (e) { err(res, 500, e.message); }
});


// ── Global leaderboard ──────────────────────────────────────────────────────
app.get('/api/leaderboard', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db(
      `SELECT
         COALESCE(usr.name, a.guest_name, 'Anonymous') AS name,
         a.user_id,
         COUNT(a.id)::int   AS attempts,
         AVG(a.percentage)::float AS avg_score,
         MAX(a.percentage)::float AS best_score,
         SUM(a.score)::float      AS total_score
       FROM attempts a
       LEFT JOIN users usr ON usr.id = a.user_id
       JOIN  polls p ON p.id = a.poll_id AND p.creator_id = $1
       WHERE a.status = 'submitted' AND a.percentage IS NOT NULL
       GROUP BY COALESCE(usr.name, a.guest_name,'Anonymous'), a.user_id
       ORDER BY avg_score DESC, attempts DESC
       LIMIT 50`,
      [u.id]
    );
    const leaderboard = r.rows.map((row, i) => ({
      rank: i + 1,
      name: row.name,
      attempts: row.attempts,
      avgScore: Math.round(row.avg_score || 0),
      bestScore: Math.round(row.best_score || 0),
      totalScore: Math.round(row.total_score || 0),
    }));
    ok(res, leaderboard);
  } catch (e) { err(res, 500, e.message); }
});

// ── Student leaderboard (for learn app) ──────────────────────────────────────
app.get('/api/leaderboard/student', async (req, res) => {
  const u = await auth(req, res, true);
  try {
    const r = await db(
      `SELECT
         COALESCE(usr.name, a.guest_name, 'Anonymous') AS name,
         a.user_id,
         COUNT(a.id)::int AS attempts,
         AVG(a.percentage)::float AS avg_score,
         MAX(a.percentage)::float AS best_score
       FROM attempts a
       LEFT JOIN users usr ON usr.id = a.user_id
       WHERE a.status = 'submitted' AND a.percentage IS NOT NULL
       GROUP BY COALESCE(usr.name, a.guest_name,'Anonymous'), a.user_id
       ORDER BY avg_score DESC LIMIT 30`
    );
    ok(res, r.rows.map((row,i)=>({
      rank:i+1, name:row.name, attempts:row.attempts,
      avgScore:Math.round(row.avg_score||0), bestScore:Math.round(row.best_score||0),
      isMe: u ? row.user_id === u.id : false,
    })));
  } catch (e) { err(res, 500, e.message); }
});

// ── Email result to student ────────────────────────────────────────────────
app.post('/api/attempts/:id/email-result', async (req, res) => {
  const u = await auth(req, res, true);
  try {
    const aR = await db(
      `SELECT a.*, p.title as poll_title, p.type as poll_type, p.settings as poll_settings
       FROM attempts a JOIN polls p ON p.id=a.poll_id WHERE a.id=$1`,
      [req.params.id]
    );
    if (!aR.rows[0]) return err(res, 404, 'Attempt not found');
    const a = aR.rows[0];

    // Resolve email: request body > attempt guest_email > logged-in user's email
    let toEmail = req.body?.email || a.guest_email;
    if (!toEmail && u) {
      const uR = await db('SELECT email FROM users WHERE id=$1', [u.id]);
      toEmail = uR.rows[0]?.email || null;
    }
    if (!toEmail) return err(res, 400, 'No email address on record for this attempt. Provide an email in the request.');

    if (!process.env.RESEND_API_KEY) {
      console.log('[email-result] No RESEND_API_KEY set — logging attempt', { attemptId: a.id, to: toEmail });
      return ok(res, { message: 'Email not sent: add RESEND_API_KEY to Vercel environment variables to enable email delivery.', to: toEmail, configured: false });
    }

    const pct       = Math.round(Number(a.percentage || 0));
    const score     = Number(a.score || 0);
    const maxScore  = Number(a.max_score || 0);
    const passed    = Boolean(a.passed);
    const timeTaken = a.time_taken ? `${Math.floor(a.time_taken / 60)}m ${a.time_taken % 60}s` : null;
    const fromEmail = process.env.FROM_EMAIL || 'OmniPoll <onboarding@resend.dev>';
    // LEARN app URL: prefer STUDENT_APP_URL env, then VITE_STUDENT_APP_URL, then default
    const learnUrl  = process.env.STUDENT_APP_URL || process.env.VITE_STUDENT_APP_URL || 'https://omnipoll-learn.vercel.app';
    const scoreColor = pct >= 70 ? '#16a34a' : pct >= 40 ? '#ca8a04' : '#dc2626';
    const gradeLabel = pct >= 90 ? 'Excellent!' : pct >= 70 ? 'Good Job!' : pct >= 50 ? 'Keep Practicing' : 'Needs Review';

    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:16px;background:#F5F5F0;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:540px;margin:auto">
    <!-- Header -->
    <div style="background:#D96C4A;border-radius:16px 16px 0 0;padding:28px 24px;text-align:center">
      <div style="font-size:32px;margin-bottom:8px">🎓</div>
      <h1 style="color:white;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.3px">OmniPoll Results</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;font-weight:500">${a.poll_title}</p>
    </div>
    <!-- Score card -->
    <div style="background:white;padding:32px 24px;text-align:center;border-left:1px solid #E4CC94;border-right:1px solid #E4CC94">
      <p style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;font-weight:600">Your Score</p>
      <p style="font-size:64px;font-weight:900;color:${scoreColor};margin:0;line-height:1">${pct}%</p>
      <p style="font-size:16px;font-weight:700;color:${scoreColor};margin:6px 0">${gradeLabel}</p>
      <p style="font-size:14px;color:#64748b;margin:8px 0 0">${score} / ${maxScore} points${timeTaken ? ` &nbsp;·&nbsp; Time: ${timeTaken}` : ''}</p>
      <div style="margin-top:12px;display:inline-block;padding:4px 14px;border-radius:20px;background:${passed ? '#dcfce7' : '#fee2e2'};color:${passed ? '#15803d' : '#dc2626'};font-size:13px;font-weight:700">
        ${passed ? '✅ Passed' : '❌ Not passed'}
      </div>
    </div>
    <!-- CTA -->
    <div style="background:#FEFAF5;padding:24px;border:1px solid #E4CC94;border-top:none">
      <a href="${learnUrl}/attempt/${a.id}/keysheet"
         style="display:block;background:#D96C4A;color:white;text-decoration:none;padding:16px;border-radius:10px;text-align:center;font-weight:700;font-size:15px;margin-bottom:16px;letter-spacing:-0.2px">
        📋 View Full Answer Sheet &amp; Key →
      </a>
      <a href="${learnUrl}/student/results"
         style="display:block;background:white;color:#64748b;text-decoration:none;padding:12px;border-radius:10px;text-align:center;font-size:13px;border:1px solid #E4CC94">
        View All My Results
      </a>
    </div>
    <!-- Footer -->
    <div style="padding:16px 24px;text-align:center">
      <p style="font-size:11px;color:#94a3b8;margin:0">Sent by OmniPoll · <a href="${learnUrl}" style="color:#D96C4A;text-decoration:none">omnipoll-learn.vercel.app</a></p>
    </div>
  </div>
</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject: `Your results for "${a.poll_title}" — ${pct}% ${gradeLabel}`,
        html: htmlBody,
      }),
    });

    if (!emailRes.ok) {
      const errData = await emailRes.json().catch(() => ({}));
      console.error('[email-result] Resend API error:', JSON.stringify(errData));
      return err(res, 502, `Email delivery failed: ${errData.message || errData.error?.message || 'Resend API error'}. Check FROM_EMAIL is a verified sender in your Resend account.`);
    }

    ok(res, { message: 'Result emailed successfully', to: toEmail, configured: true });
  } catch (e) { err(res, 500, e.message); }
});

// ── Tab switch alert from student ─────────────────────────────────────────────
app.post('/api/polls/:id/tab-switch', async (req, res) => {
  // Optional auth (guest or logged-in student)
  let u = null;
  try { u = await auth(req, res, true); } catch {}
  try {
    const { studentName, studentEmail, switchCount=1, severity='low', pollTitle } = req.body;
    const alertId = uid();
    // Get poll creator to notify
    const pR = await db('SELECT creator_id, title FROM polls WHERE id=$1', [req.params.id]);
    const poll = pR.rows[0];
    if (!poll) return err(res, 404, 'Poll not found');
    // Store alert
    await db(
      `INSERT INTO tab_alerts (id,poll_id,student_name,student_email,student_user_id,switch_count,severity,poll_title)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT DO NOTHING`,
      [alertId, req.params.id, studentName||u?.name||'Guest', studentEmail||u?.email||null,
       u?.id||null, switchCount, severity, pollTitle||poll.title]
    );
    // Real-time push to teacher's moderation page
    await push(`poll-${req.params.id}`, 'tab-switch', {
      studentName: studentName||u?.name||'Guest',
      studentEmail: studentEmail||u?.email,
      switchCount, severity, pollTitle: poll.title, alertId,
    });
    // Push notification to teacher
    const notifId = uid();
    await db(
      `INSERT INTO notifications (id,user_id,type,title,message,link,data)
       VALUES ($1,$2,'tab_switch',$3,$4,$5,$6)`,
      [notifId, poll.creator_id,
       `⚠️ Tab Switch Detected`,
       `${studentName||'A student'} switched tabs ${switchCount} time(s) — severity: ${severity}`,
       `/moderation`, JSON.stringify({ pollId: req.params.id, studentName, switchCount, severity })]
    );
    ok(res, { message: 'Alert recorded' });
  } catch (e) { err(res, 500, e.message); }
});

// ── Get tab alerts for a poll (teacher only) ──────────────────────────────────
app.get('/api/polls/:id/tab-alerts', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db(
      `SELECT * FROM tab_alerts WHERE poll_id=$1 ORDER BY created_at DESC LIMIT 100`,
      [req.params.id]
    );
    ok(res, r.rows.map(a => ({
      id: a.id, studentName: a.student_name, studentEmail: a.student_email,
      switchCount: a.switch_count, severity: a.severity, pollTitle: a.poll_title,
      isResolved: a.is_resolved, createdAt: a.created_at,
    })));
  } catch (e) { err(res, 500, e.message); }
});

// ── Resolve tab alert ─────────────────────────────────────────────────────────
app.patch('/api/tab-alerts/:id/resolve', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    await db('UPDATE tab_alerts SET is_resolved=true WHERE id=$1', [req.params.id]);
    ok(res, { message: 'Resolved' });
  } catch (e) { err(res, 500, e.message); }
});

// ── All tab alerts across all polls (moderation dashboard) ───────────────────
app.get('/api/moderation/alerts', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db(
      `SELECT ta.*,
              p.title as poll_title_from_poll,
              p.classroom_id,
              c.name as classroom_name
       FROM tab_alerts ta
       JOIN polls p ON p.id=ta.poll_id
       LEFT JOIN classrooms c ON c.id=p.classroom_id
       WHERE p.creator_id=$1 ORDER BY ta.created_at DESC LIMIT 200`,
      [u.id]
    );
    ok(res, r.rows.map(a => ({
      id: a.id, pollId: a.poll_id, studentName: a.student_name, studentEmail: a.student_email,
      switchCount: a.switch_count, severity: a.severity,
      pollTitle: a.poll_title || a.poll_title_from_poll,
      classroomName: a.classroom_name || null,
      isResolved: a.is_resolved, createdAt: a.created_at,
    })));
  } catch (e) { err(res, 500, e.message); }
});

// ── Resolve ALL unresolved alerts for this teacher ────────────────────────────
app.patch('/api/moderation/resolve-all', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    await db(
      `UPDATE tab_alerts SET is_resolved=true
       WHERE id IN (
         SELECT ta.id FROM tab_alerts ta
         JOIN polls p ON p.id=ta.poll_id
         WHERE p.creator_id=$1 AND ta.is_resolved=false
       )`,
      [u.id]
    );
    ok(res, { message: 'All resolved' });
  } catch (e) { err(res, 500, e.message); }
});

// ── Active participants per poll (for Live Sessions panel) ────────────────────
app.get('/api/moderation/active-sessions', async (req, res) => {
  const u = await auth(req, res);
  if (!u) return;
  try {
    const r = await db(
      `SELECT p.id, p.title, p.code,
              COUNT(DISTINCT a.id)::int AS active_count
       FROM polls p
       LEFT JOIN attempts a ON a.poll_id=p.id AND a.status='in_progress'
       WHERE p.creator_id=$1 AND p.status='active'
       GROUP BY p.id, p.title, p.code
       ORDER BY p.updated_at DESC`,
      [u.id]
    );
    ok(res, r.rows.map(p => ({
      id: p.id, title: p.title, code: p.code, activeCount: p.active_count,
    })));
  } catch (e) { err(res, 500, e.message); }
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ status:'ok', ts: new Date().toISOString() }));

// ── FORMAT HELPERS ────────────────────────────────────────────────────────────
function formatPoll(p) {
  if (!p) return null;
  return {
    id:p.id, code:p.code, title:p.title, description:p.description,
    type:p.type, status:p.status, creatorId:p.creator_id,
    options: typeof p.options==='string'?JSON.parse(p.options):p.options||[],
    questions: typeof p.questions==='string'?JSON.parse(p.questions||'[]'):p.questions||[],
    matrixRows: typeof p.matrix_rows==='string'?JSON.parse(p.matrix_rows):p.matrix_rows||[],
    matrixCols: typeof p.matrix_cols==='string'?JSON.parse(p.matrix_cols):p.matrix_cols||[],
    settings: typeof p.settings==='string'?JSON.parse(p.settings):p.settings||{},
    classroomId:p.classroom_id, totalVotes:p.total_votes||0, uniqueParticipants:p.unique_participants||0,
    creator: p.creator_name?{name:p.creator_name,email:p.creator_email}:null,
    createdAt:p.created_at, updatedAt:p.updated_at,
    closedAt:p.closed_at, resultsReleasedAt:p.results_released_at,
  };
}

function formatAttempt(a) {
  if (!a) return null;
  return {
    id:a.id, pollId:a.poll_id, userId:a.user_id, guestName:a.guest_name, guestEmail:a.guest_email,
    score:    a.score    !== null && a.score    !== undefined ? Number(a.score)    : 0,
    maxScore: a.max_score !== null && a.max_score !== undefined ? Number(a.max_score) : 0,
    percentage: a.percentage !== null && a.percentage !== undefined ? Math.round(Number(a.percentage)) : null,
    passed:a.passed, timeTaken:a.time_taken, status:a.status,
    startedAt:a.created_at, submittedAt:a.submitted_at,
    answers: typeof a.answers==='string'?JSON.parse(a.answers||'[]'):a.answers||[],
    poll: a.poll_title ? { title:a.poll_title, type:a.poll_type, status:a.poll_status } : null,
  };
}

// POST /api/contact
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message, subject = 'General Question' } = req.body;
    if (!name || !email) return err(res, 400, 'Name and email are required');
    const safeMsg = (message || '').substring(0, 2000);

    console.log(`[Contact] ${name} <${email}> — ${subject}: ${safeMsg.substring(0, 80)}`);

    if (process.env.RESEND_API_KEY) {
      const contactEmail = process.env.CONTACT_EMAIL || process.env.FROM_EMAIL || 'hello@omnipoll.app';
      const fromEmail    = process.env.FROM_EMAIL || 'OmniPoll <onboarding@resend.dev>';
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [contactEmail],
          reply_to: email,
          subject: `[OmniPoll Contact] ${subject} — from ${name}`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto;padding:24px">
              <h2 style="color:#D96C4A;margin:0 0 16px">New Contact Message</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:6px 0;color:#64748b;width:80px">From</td><td style="padding:6px 0;font-weight:600">${name} &lt;${email}&gt;</td></tr>
                <tr><td style="padding:6px 0;color:#64748b">Topic</td><td style="padding:6px 0">${subject}</td></tr>
              </table>
              <div style="margin-top:16px;padding:16px;background:#FEFAF5;border-radius:8px;border:1px solid #E4CC94">
                <p style="margin:0;font-size:14px;color:#334155;white-space:pre-wrap">${safeMsg.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
              </div>
              <p style="font-size:11px;color:#94a3b8;margin-top:16px">OmniPoll contact form submission</p>
            </div>`,
        }),
      });
    }

    ok(res, { message: 'Message received! We will reply within 24 hours.' });
  } catch (e) { err(res, 500, e.message); }
});

module.exports = app;
