import { NextRequest, NextResponse } from 'next/server';
import { updatePollStatus } from '@/lib/db';
import { broadcastStatus } from '@/lib/pusher';

interface Params { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { status } = await req.json() as { status: string };
    if (!['live', 'paused', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await updatePollStatus(params.id, status);

    try { await broadcastStatus(params.id, status); } catch { /* ignore */ }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error('[PATCH status]', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
