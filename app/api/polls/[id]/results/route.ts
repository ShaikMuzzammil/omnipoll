import { NextRequest, NextResponse } from 'next/server';
import { getPollById } from '@/lib/db';
import { computeResults } from './compute';

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const poll = await getPollById(params.id);
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    const results = computeResults(poll);
    return NextResponse.json({ results, participants: poll.participants?.length || 0 });
  } catch (err) {
    console.error('[GET results]', err);
    return NextResponse.json({ error: 'Failed to compute results' }, { status: 500 });
  }
}
