import { NextRequest, NextResponse } from 'next/server';
import { getPollByCode } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 });

    const poll = await getPollByCode(code.toUpperCase().trim());
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

    // Don't expose responses in the join response for privacy
    const safePoll = { ...poll, responses: [] };
    return NextResponse.json({ poll: safePoll });
  } catch (err) {
    console.error('[GET join]', err);
    return NextResponse.json({ error: 'Failed to find poll' }, { status: 500 });
  }
}
