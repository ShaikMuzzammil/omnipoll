'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running OmniPoll v3 database migration…');

    await client.query(`
      -- ── Extensions ──────────────────────────────────────────────────────
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- ── Users ────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS users (
        id            TEXT PRIMARY KEY,
        name          TEXT NOT NULL,
        email         TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role          TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher','student','admin')),
        institution   TEXT,
        avatar        TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- ── Polls ────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS polls (
        id                   TEXT PRIMARY KEY,
        code                 TEXT UNIQUE NOT NULL,
        title                TEXT NOT NULL,
        description          TEXT,
        type                 TEXT NOT NULL,
        status               TEXT NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft','active','paused','closed','results_released')),
        creator_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        classroom_id         TEXT,
        options              JSONB NOT NULL DEFAULT '[]',
        matrix_rows          JSONB NOT NULL DEFAULT '[]',
        matrix_cols          JSONB NOT NULL DEFAULT '[]',
        settings             JSONB NOT NULL DEFAULT '{}',
        scheduled_start_at   TIMESTAMPTZ,
        closed_at            TIMESTAMPTZ,
        results_released_at  TIMESTAMPTZ,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS polls_creator_idx   ON polls(creator_id);
      CREATE INDEX IF NOT EXISTS polls_code_idx      ON polls(UPPER(code));
      CREATE INDEX IF NOT EXISTS polls_status_idx    ON polls(status);
      CREATE INDEX IF NOT EXISTS polls_classroom_idx ON polls(classroom_id);

      -- ── Votes (live polling responses) ───────────────────────────────────
      CREATE TABLE IF NOT EXISTS votes (
        id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        poll_id          TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        user_id          TEXT REFERENCES users(id) ON DELETE SET NULL,
        guest_name       TEXT,
        guest_email      TEXT,
        selected_options JSONB NOT NULL DEFAULT '[]',
        text_answer      TEXT,
        numeric_answer   NUMERIC,
        ranking_order    JSONB,
        matrix_answers   JSONB,
        heatmap_x        NUMERIC,
        heatmap_y        NUMERIC,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS votes_poll_idx  ON votes(poll_id);
      CREATE INDEX IF NOT EXISTS votes_user_idx  ON votes(user_id);

      -- ── Attempts (quiz/graded attempts) ──────────────────────────────────
      CREATE TABLE IF NOT EXISTS attempts (
        id            TEXT PRIMARY KEY,
        poll_id       TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
        guest_name    TEXT,
        guest_email   TEXT,
        status        TEXT NOT NULL DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress','submitted','graded')),
        score         NUMERIC,
        max_score     NUMERIC,
        percentage    NUMERIC,
        passed        BOOLEAN,
        time_taken    INTEGER,
        answers       JSONB DEFAULT '[]',
        answers_draft JSONB DEFAULT '{}',
        submitted_at  TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS attempts_poll_idx ON attempts(poll_id);
      CREATE INDEX IF NOT EXISTS attempts_user_idx ON attempts(user_id);

      -- ── Classrooms ───────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS classrooms (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        description TEXT,
        code        TEXT UNIQUE NOT NULL,
        teacher_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS classrooms_teacher_idx ON classrooms(teacher_id);

      CREATE TABLE IF NOT EXISTS classroom_students (
        classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
        user_id      TEXT NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
        joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (classroom_id, user_id)
      );

      -- ── Q&A ──────────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS qa_items (
        id             TEXT PRIMARY KEY,
        poll_id        TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        text           TEXT NOT NULL,
        author_name    TEXT NOT NULL DEFAULT 'Anonymous',
        author_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        upvotes        INTEGER NOT NULL DEFAULT 0,
        answered       BOOLEAN NOT NULL DEFAULT FALSE,
        answer         TEXT,
        status         TEXT NOT NULL DEFAULT 'approved'
                         CHECK (status IN ('approved','rejected','archived')),
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS qa_poll_idx ON qa_items(poll_id);

      -- ── Notifications ────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS notifications (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type       TEXT NOT NULL,
        title      TEXT NOT NULL,
        message    TEXT NOT NULL,
        link       TEXT,
        is_read    BOOLEAN NOT NULL DEFAULT FALSE,
        data       JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS notifs_user_idx  ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS notifs_read_idx  ON notifications(user_id, is_read);

      -- ── Templates ────────────────────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS templates (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        poll_id    TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, poll_id)
      );
    `);

    // ── Seed demo accounts ─────────────────────────────────────────────────
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = (() => {
      try { return require('crypto'); } catch { return { v4: () => Math.random().toString(36).slice(2) }; }
    })();

    function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
    function genCode(n=6) {
      const c='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      return Array.from({length:n},()=>c[Math.floor(Math.random()*c.length)]).join('');
    }

    // Demo teacher
    const teacherExists = await client.query('SELECT id FROM users WHERE email=$1', ['demo@omnipoll.io']);
    let teacherId;
    if (!teacherExists.rows[0]) {
      teacherId = uid();
      const hash = await bcrypt.hash('demo1234', 10);
      await client.query(
        'INSERT INTO users (id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5)',
        [teacherId, 'Demo Teacher', 'demo@omnipoll.io', hash, 'teacher']
      );
      console.log('✅ Demo teacher: demo@omnipoll.io / demo1234');
    } else {
      teacherId = teacherExists.rows[0].id;
    }

    // Demo student
    const studentExists = await client.query('SELECT id FROM users WHERE email=$1', ['student@omnipoll.io']);
    let studentId;
    if (!studentExists.rows[0]) {
      studentId = uid();
      const hash = await bcrypt.hash('student123', 10);
      await client.query(
        'INSERT INTO users (id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,$5)',
        [studentId, 'Demo Student', 'student@omnipoll.io', hash, 'student']
      );
      console.log('✅ Demo student: student@omnipoll.io / student123');
    } else {
      studentId = studentExists.rows[0].id;
    }

    // Demo classroom
    const clsExists = await client.query('SELECT id FROM classrooms WHERE teacher_id=$1 LIMIT 1', [teacherId]);
    let clsId;
    if (!clsExists.rows[0]) {
      clsId = uid();
      await client.query(
        'INSERT INTO classrooms (id,name,description,code,teacher_id) VALUES ($1,$2,$3,$4,$5)',
        [clsId, 'Demo Classroom', 'A sample classroom for testing', genCode(), teacherId]
      );
      await client.query('INSERT INTO classroom_students (classroom_id,user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [clsId, studentId]);
      console.log('✅ Demo classroom created');
    }

    // Demo poll (multiple choice)
    const pollExists = await client.query('SELECT id FROM polls WHERE creator_id=$1 LIMIT 1', [teacherId]);
    if (!pollExists.rows[0]) {
      const pollId = uid();
      const code   = genCode();
      await client.query(
        `INSERT INTO polls (id,code,title,description,type,status,creator_id,options,settings)
         VALUES ($1,$2,$3,$4,'multiple_choice','active',$5,$6,$7)`,
        [pollId, code, 'What is the capital of France?',
         'A sample geography question to get you started.',
         teacherId,
         JSON.stringify([
           { id:'o1', text:'London',   isCorrect:false, points:0 },
           { id:'o2', text:'Paris',    isCorrect:true,  points:1 },
           { id:'o3', text:'Berlin',   isCorrect:false, points:0 },
           { id:'o4', text:'Madrid',   isCorrect:false, points:0 },
         ]),
         JSON.stringify({
           allowAnonymous:true, requireLogin:false, oneResponsePerUser:false,
           showResultsLive:true, showCorrectAnswers:true, showKeySheetAfter:true,
           shuffleOptions:false, shuffleQuestions:false, preventTabSwitch:false,
           showProgressBar:true, allowReview:true, passingScore:50,
         }),
        ]
      );
      console.log(`✅ Demo poll created — join code: ${code}`);
    }

    console.log('✅ Migration complete!');
    console.log('');
    console.log('Demo accounts:');
    console.log('  Teacher: demo@omnipoll.io / demo1234');
    console.log('  Student: student@omnipoll.io / student123');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(e => {
  console.error('❌ Migration failed:', e.message);
  process.exit(1);
});
