import { NextRequest, NextResponse } from 'next/server';
import { moderateQAQuestion, getPollById } from '@/lib/db';
import { broadcastQA } from '@/lib/pusher';

interface Params { params: { id: string; qid: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { action } = await req.json() as { action: string };
    await moderateQAQuestion(params.id, params.qid, action);

    try {
      const poll = await getPollById(params.id);
      if (poll) await broadcastQA(params.id, poll.qaQuestions);
    } catch { /* ignore */ }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH moderate]', err);
    return NextResponse.json({ error: 'Failed to moderate question' }, { status: 500 });
  }
}
