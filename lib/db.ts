import { neon } from '@neondatabase/serverless';
import type { Poll, QAQuestion, QuizSubmission } from './types';

// Create a new connection per request (Neon serverless is stateless/edge-friendly)
export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers to normalize DB rows to Poll objects
// ──────────────────────────────────────────────────────────────────────────────

export function rowToPoll(row: Record<string, unknown>): Poll {
  return {
    id: row.id as string,
    code: row.code as string,
    title: row.title as string,
    question: row.question as string,
    description: row.description as string | undefined,
    type: row.type as Poll['type'],
    status: row.status as Poll['status'],
    settings: (row.settings as Poll['settings']) || {},
    options: (row.options as Poll['options']) || [],
    quizQuestions: (row.quiz_questions as Poll['quizQuestions']) || [],
    responses: [], // loaded separately
    qaQuestions: [], // loaded separately
    creatorId: row.creator_id as string | undefined,
    participants: (row.participants as string[]) || [],
    createdAt: Number(row.created_at),
    updatedAt: row.updated_at ? Number(row.updated_at) : undefined,
    expiresAt: row.expires_at ? Number(row.expires_at) : null,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Database query functions
// ──────────────────────────────────────────────────────────────────────────────

export async function getUserByEmail(email: string) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return rows[0] || null;
}

export async function getUserById(id: string) {
  const sql = getDb();
  const rows = await sql`SELECT id, name, email, plan FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function createUser(id: string, name: string, email: string, passwordHash: string) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO users (id, name, email, password_hash)
    VALUES (${id}, ${name}, ${email}, ${passwordHash})
    RETURNING id, name, email, plan
  `;
  return rows[0];
}

export async function getPollById(id: string): Promise<Poll | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM polls WHERE id = ${id} LIMIT 1`;
  if (!rows[0]) return null;
  const poll = rowToPoll(rows[0] as Record<string, unknown>);

  // Load responses
  const responses = await sql`SELECT * FROM poll_responses WHERE poll_id = ${id} ORDER BY created_at DESC`;
  poll.responses = responses.map((r) => ({
    id: r.id as string,
    participantId: r.participant_id as string,
    participantName: r.participant_name as string,
    answer: r.answer,
    questionId: r.question_id as string,
    isCorrect: r.is_correct as boolean,
    score: r.score as number,
    createdAt: Number(r.created_at),
  }));

  // Load Q&A questions
  const qaQs = await sql`SELECT * FROM qa_questions WHERE poll_id = ${id} ORDER BY upvotes DESC, created_at ASC`;
  poll.qaQuestions = qaQs.map((q) => ({
    id: q.id as string,
    questionText: q.question_text as string,
    upvotes: q.upvotes as number,
    status: q.status as QAQuestion['status'],
    participantId: q.participant_id as string,
    createdAt: Number(q.created_at),
  }));

  // Load quiz submissions
  const quizSubs = await sql`SELECT * FROM quiz_submissions WHERE poll_id = ${id} ORDER BY score DESC`;
  poll.quizSubmissions = quizSubs.map((s) => ({
    participantId: s.participant_id as string,
    participantName: s.participant_name as string,
    score: s.score as number,
    correct: s.correct as number,
    answered: s.answered as number,
    answers: (s.answers as QuizSubmission['answers']) || [],
    completedAt: Number(s.completed_at),
  }));

  return poll;
}

export async function getPollByCode(code: string): Promise<Poll | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM polls WHERE code = ${code.toUpperCase()} LIMIT 1`;
  if (!rows[0]) return null;
  return getPollById((rows[0] as Record<string, unknown>).id as string);
}

export async function getPollsByCreator(creatorId: string): Promise<Poll[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM polls WHERE creator_id = ${creatorId} ORDER BY created_at DESC`;
  return rows.map((r) => rowToPoll(r as Record<string, unknown>));
}

export async function getAllPolls(): Promise<Poll[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM polls ORDER BY created_at DESC LIMIT 100`;
  return rows.map((r) => rowToPoll(r as Record<string, unknown>));
}

export async function insertPoll(
  id: string, code: string, title: string, question: string,
  description: string | undefined, type: string, settings: unknown,
  options: unknown, quizQuestions: unknown, creatorId: string | null, expiresAt: number | null
) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO polls (id, code, title, question, description, type, settings, options, quiz_questions, creator_id, expires_at)
    VALUES (
      ${id}, ${code}, ${title}, ${question}, ${description || null},
      ${type}, ${JSON.stringify(settings)}, ${JSON.stringify(options)},
      ${JSON.stringify(quizQuestions)}, ${creatorId}, ${expiresAt}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function updatePollStatus(id: string, status: string) {
  const sql = getDb();
  await sql`UPDATE polls SET status = ${status}, updated_at = ${Date.now()} WHERE id = ${id}`;
}

export async function deletePollById(id: string) {
  const sql = getDb();
  await sql`DELETE FROM polls WHERE id = ${id}`;
}

export async function addParticipant(pollId: string, participantId: string) {
  const sql = getDb();
  // Use PostgreSQL JSONB array append if not already present
  await sql`
    UPDATE polls
    SET participants = (
      CASE WHEN participants @> ${JSON.stringify([participantId])}::jsonb
        THEN participants
        ELSE participants || ${JSON.stringify([participantId])}::jsonb
      END
    ),
    updated_at = ${Date.now()}
    WHERE id = ${pollId}
  `;
}

export async function insertResponse(
  id: string, pollId: string, participantId: string,
  participantName: string, answer: unknown, questionId?: string,
  isCorrect?: boolean, score?: number
) {
  const sql = getDb();
  await sql`
    INSERT INTO poll_responses (id, poll_id, participant_id, participant_name, answer, question_id, is_correct, score)
    VALUES (${id}, ${pollId}, ${participantId}, ${participantName}, ${JSON.stringify(answer)}, ${questionId || null}, ${isCorrect ?? null}, ${score ?? 0})
  `;
}

export async function insertQAQuestion(id: string, pollId: string, questionText: string, participantId: string) {
  const sql = getDb();
  await sql`
    INSERT INTO qa_questions (id, poll_id, question_text, participant_id)
    VALUES (${id}, ${pollId}, ${questionText}, ${participantId})
  `;
}

export async function upvoteQAQuestion(pollId: string, questionId: string) {
  const sql = getDb();
  await sql`UPDATE qa_questions SET upvotes = upvotes + 1 WHERE id = ${questionId} AND poll_id = ${pollId}`;
}

export async function moderateQAQuestion(pollId: string, questionId: string, action: string) {
  const statusMap: Record<string, string> = {
    answer: 'answered',
    highlight: 'highlighted',
    dismiss: 'dismissed',
  };
  const status = statusMap[action] || 'open';
  const sql = getDb();
  await sql`UPDATE qa_questions SET status = ${status} WHERE id = ${questionId} AND poll_id = ${pollId}`;
}

export async function insertQuizSubmission(
  id: string, pollId: string, participantId: string,
  participantName: string, score: number, correct: number,
  answered: number, answers: unknown
) {
  const sql = getDb();
  await sql`
    INSERT INTO quiz_submissions (id, poll_id, participant_id, participant_name, score, correct, answered, answers)
    VALUES (${id}, ${pollId}, ${participantId}, ${participantName}, ${score}, ${correct}, ${answered}, ${JSON.stringify(answers)})
    ON CONFLICT DO NOTHING
  `;
}

export async function getDashboardStats(creatorId: string) {
  const sql = getDb();
  const [stats] = await sql`
    SELECT
      COUNT(*) AS total_polls,
      COUNT(*) FILTER (WHERE status = 'live') AS live_polls,
      COUNT(*) FILTER (WHERE status = 'closed') AS closed_polls
    FROM polls WHERE creator_id = ${creatorId}
  `;

  const [respStats] = await sql`
    SELECT
      COALESCE(SUM(jsonb_array_length(p.participants)), 0) AS total_participants,
      (SELECT COUNT(*) FROM poll_responses pr JOIN polls pp ON pr.poll_id = pp.id WHERE pp.creator_id = ${creatorId}) AS total_responses
    FROM polls p WHERE p.creator_id = ${creatorId}
  `;

  return {
    totalPolls: Number(stats?.total_polls || 0),
    livePolls: Number(stats?.live_polls || 0),
    closedPolls: Number(stats?.closed_polls || 0),
    totalParticipants: Number(respStats?.total_participants || 0),
    totalResponses: Number(respStats?.total_responses || 0),
  };
}
