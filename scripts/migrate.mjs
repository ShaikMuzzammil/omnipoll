#!/usr/bin/env node
// scripts/migrate.mjs
// Run: node scripts/migrate.mjs
// Requires DATABASE_URL in .env or environment

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env if present
try {
  const env = readFileSync(join(__dirname, '../.env'), 'utf-8');
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#') && v.length) {
      process.env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
    }
  }
} catch { /* .env not found, using existing env vars */ }

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Add it to .env or environment.');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const SCHEMA = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan        TEXT DEFAULT 'free' CHECK (plan IN ('free','starter','pro')),
  created_at  BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

-- Polls (all metadata + JSON blobs for options/settings)
CREATE TABLE IF NOT EXISTS polls (
  id            TEXT PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  question      TEXT NOT NULL,
  description   TEXT,
  type          TEXT NOT NULL,
  status        TEXT DEFAULT 'live' CHECK (status IN ('live','paused','closed')),
  settings      JSONB DEFAULT '{}'::jsonb,
  options       JSONB DEFAULT '[]'::jsonb,
  quiz_questions JSONB DEFAULT '[]'::jsonb,
  creator_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  participants  JSONB DEFAULT '[]'::jsonb,
  created_at    BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  updated_at    BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000,
  expires_at    BIGINT
);

CREATE INDEX IF NOT EXISTS idx_polls_code ON polls(code);
CREATE INDEX IF NOT EXISTS idx_polls_creator ON polls(creator_id);
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);

-- Poll responses (all vote types)
CREATE TABLE IF NOT EXISTS poll_responses (
  id              TEXT PRIMARY KEY,
  poll_id         TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  participant_id  TEXT,
  participant_name TEXT,
  answer          JSONB,
  question_id     TEXT,
  is_correct      BOOLEAN,
  score           INTEGER DEFAULT 0,
  created_at      BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

CREATE INDEX IF NOT EXISTS idx_responses_poll ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_responses_participant ON poll_responses(participant_id);

-- Q&A questions (submitted by participants)
CREATE TABLE IF NOT EXISTS qa_questions (
  id            TEXT PRIMARY KEY,
  poll_id       TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  upvotes       INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'open' CHECK (status IN ('open','answered','highlighted','dismissed')),
  participant_id TEXT,
  created_at    BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

CREATE INDEX IF NOT EXISTS idx_qa_poll ON qa_questions(poll_id);

-- Quiz submissions (for leaderboard)
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id              TEXT PRIMARY KEY,
  poll_id         TEXT NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  participant_id  TEXT NOT NULL,
  participant_name TEXT,
  score           INTEGER DEFAULT 0,
  correct         INTEGER DEFAULT 0,
  answered        INTEGER DEFAULT 0,
  answers         JSONB DEFAULT '[]'::jsonb,
  completed_at    BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
);

CREATE INDEX IF NOT EXISTS idx_quiz_poll ON quiz_submissions(poll_id);

-- Demo user seed
INSERT INTO users (id, name, email, password_hash, plan)
VALUES (
  'demo-user-001',
  'Demo User',
  'demo@omnipoll.io',
  -- bcrypt hash of 'demo1234'
  '\$2b\$10\$rOyxRCfIKF7b2nIfqTExv.OWn67K5sBGf7EFOxNBHjGBkQiEcFPQ2',
  'pro'
)
ON CONFLICT (email) DO NOTHING;
`;

async function migrate() {
  console.log('🔌 Connecting to Neon database...');
  try {
    const statements = SCHEMA.split(';').map(s => s.trim()).filter(Boolean);
    let count = 0;
    for (const stmt of statements) {
      await sql.unsafe ? sql.unsafe(stmt) : sql(stmt);
      count++;
    }
    console.log(`✅ Migration complete — ${count} statements executed`);
    console.log('\n🎉 Demo credentials:');
    console.log('   Email:    demo@omnipoll.io');
    console.log('   Password: demo1234\n');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
