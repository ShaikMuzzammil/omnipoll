#!/usr/bin/env node
// scripts/migrate.cjs — Run: node scripts/migrate.cjs
'use strict';

// Load .env
const fs = require('fs'), path = require('path');
try {
  const env = fs.readFileSync(path.join(__dirname,'../.env'),'utf8');
  env.split('\n').forEach(line => {
    const [k,...v] = line.split('=');
    if (k && !k.startsWith('#') && v.length) {
      process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g,'');
    }
  });
} catch { /* .env not found */ }

const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('🔌 Connecting to Neon…');

  // users
  await sql`CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    plan          TEXT DEFAULT 'free',
    created_at    BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)
  )`;

  // polls
  await sql`CREATE TABLE IF NOT EXISTS polls (
    id             TEXT PRIMARY KEY,
    code           TEXT UNIQUE NOT NULL,
    title          TEXT NOT NULL,
    question       TEXT NOT NULL,
    description    TEXT,
    type           TEXT NOT NULL,
    status         TEXT DEFAULT 'live',
    settings       JSONB DEFAULT '{}'::jsonb,
    options        JSONB DEFAULT '[]'::jsonb,
    quiz_questions JSONB DEFAULT '[]'::jsonb,
    creator_id     TEXT,
    participants   JSONB DEFAULT '[]'::jsonb,
    created_at     BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000),
    updated_at     BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000),
    expires_at     BIGINT
  )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_polls_code       ON polls(code)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_polls_creator    ON polls(creator_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_polls_status     ON polls(status)`;

  // poll_responses
  await sql`CREATE TABLE IF NOT EXISTS poll_responses (
    id               TEXT PRIMARY KEY,
    poll_id          TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    participant_id   TEXT,
    participant_name TEXT,
    answer           JSONB,
    question_id      TEXT,
    is_correct       BOOLEAN,
    score            INTEGER DEFAULT 0,
    created_at       BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)
  )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_responses_poll        ON poll_responses(poll_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_responses_participant ON poll_responses(participant_id)`;

  // qa_questions
  await sql`CREATE TABLE IF NOT EXISTS qa_questions (
    id             TEXT PRIMARY KEY,
    poll_id        TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    question_text  TEXT NOT NULL,
    upvotes        INTEGER DEFAULT 0,
    status         TEXT DEFAULT 'open',
    participant_id TEXT,
    created_at     BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)
  )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_qa_poll ON qa_questions(poll_id)`;

  // quiz_submissions
  await sql`CREATE TABLE IF NOT EXISTS quiz_submissions (
    id               TEXT PRIMARY KEY,
    poll_id          TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    participant_id   TEXT NOT NULL,
    participant_name TEXT,
    score            INTEGER DEFAULT 0,
    correct          INTEGER DEFAULT 0,
    answered         INTEGER DEFAULT 0,
    answers          JSONB DEFAULT '[]'::jsonb,
    completed_at     BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)
  )`;

  await sql`CREATE INDEX IF NOT EXISTS idx_quiz_poll ON quiz_submissions(poll_id)`;

  // Demo user (bcrypt hash of 'demo1234')
  await sql`INSERT INTO users (id, name, email, password_hash, plan)
    VALUES (
      'demo-user-001',
      'Demo User',
      'demo@omnipoll.io',
      '$2b$10$rOyxRCfIKF7b2nIfqTExv.OWn67K5sBGf7EFOxNBHjGBkQiEcFPQ2',
      'pro'
    ) ON CONFLICT (email) DO NOTHING`;

  console.log('✅ Migration complete — all tables created');
  console.log('\n🎉 Demo credentials:');
  console.log('   Email:    demo@omnipoll.io');
  console.log('   Password: demo1234\n');
}

migrate().catch(e => { console.error('❌ Migration failed:', e.message); process.exit(1); });
