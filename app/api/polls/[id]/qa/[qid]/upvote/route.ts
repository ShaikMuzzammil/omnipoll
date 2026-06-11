import { NextRequest, NextResponse } from 'next/server';
import { upvoteQAQuestion, getPollById } from '@/lib/db';
import { broadcastQA } from '@/lib/pusher';

interface Params { params: { id: string; qid: string } }

export async function PUT(_req: NextRequest, { params }: Params) {
  try {
    await upvoteQAQuestion(params.id, params.qid);

    try {
      const poll = await getPollById(params.id);
      if (poll) await broadcastQA(params.id, poll.qaQuestions);
    } catch { /* ignore */ }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PUT upvote]', err);
    return NextResponse.json({ error: 'Failed to upvote' }, { status: 500 });
  }
}
