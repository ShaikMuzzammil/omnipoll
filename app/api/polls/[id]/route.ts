import { NextRequest, NextResponse } from 'next/server';
import { getPollById, deletePollById } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';
import { computeResults } from '../[id]/results/compute';

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const poll = await getPollById(params.id);
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

    const results = computeResults(poll);
    return NextResponse.json({ poll, results });
  } catch (err) {
    console.error('[GET /api/polls/[id]]', err);
    return NextResponse.json({ error: 'Failed to fetch poll' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const token = extractToken(req.headers.get('Authorization'));
    const user = token ? await verifyToken(token) : null;
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const poll = await getPollById(params.id);
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    if (poll.creatorId && poll.creatorId !== user.sub) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deletePollById(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/polls/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete poll' }, { status: 500 });
  }
}
