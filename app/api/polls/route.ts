import { NextRequest, NextResponse } from 'next/server';
import { getPollsByCreator, getAllPolls, insertPoll } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';
import { genId, genCode } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');

    const polls = creatorId
      ? await getPollsByCreator(creatorId)
      : await getAllPolls();

    return NextResponse.json({ polls });
  } catch (err) {
    console.error('[GET /api/polls]', err);
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req.headers.get('Authorization'));
    const user = token ? await verifyToken(token) : null;

    const body = await req.json() as Record<string, unknown>;
    const {
      title, question, description, type,
      settings = {}, options = [], quizQuestions = [],
      expiresAt = null,
    } = body;

    if (!title || !question || !type) {
      return NextResponse.json({ error: 'title, question, and type are required' }, { status: 400 });
    }

    const id = genId();
    const code = genCode();
    const creatorId = user?.sub || (body.creatorId as string) || null;

    const row = await insertPoll(
      id, code,
      String(title), String(question),
      description ? String(description) : undefined,
      String(type),
      settings, options, quizQuestions,
      creatorId,
      expiresAt ? Number(expiresAt) : null
    );

    return NextResponse.json({
      poll: {
        id: row.id,
        code: row.code,
        title: row.title,
        question: row.question,
        type: row.type,
        status: row.status,
        settings: row.settings,
        options: row.options,
        quizQuestions: row.quiz_questions,
        creatorId: row.creator_id,
        participants: [],
        responses: [],
        qaQuestions: [],
        createdAt: Number(row.created_at),
        expiresAt: row.expires_at ? Number(row.expires_at) : null,
      }
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/polls]', err);
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 });
  }
}
