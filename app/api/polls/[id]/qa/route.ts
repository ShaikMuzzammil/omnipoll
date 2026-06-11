import { NextRequest, NextResponse } from 'next/server';
import { getPollById, insertQAQuestion } from '@/lib/db';
import { broadcastQA } from '@/lib/pusher';
import { genId } from '@/lib/utils';

interface Params { params: { id: string } }

// GET — list Q&A questions
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const poll = await getPollById(params.id);
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    const questions = [...poll.qaQuestions].sort((a, b) => b.upvotes - a.upvotes);
    return NextResponse.json({ questions });
  } catch (err) {
    console.error('[GET qa]', err);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST — submit a new question
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { questionText, participantId } = await req.json() as { questionText: string; participantId: string };
    if (!questionText?.trim()) return NextResponse.json({ error: 'questionText is required' }, { status: 400 });

    const id = genId();
    await insertQAQuestion(id, params.id, questionText.trim(), participantId || 'anon');

    // Broadcast updated questions
    try {
      const poll = await getPollById(params.id);
      if (poll) await broadcastQA(params.id, poll.qaQuestions);
    } catch { /* ignore */ }

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (err) {
    console.error('[POST qa]', err);
    return NextResponse.json({ error: 'Failed to submit question' }, { status: 500 });
  }
}
