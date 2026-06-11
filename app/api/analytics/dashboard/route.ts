import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creatorId');
    if (!creatorId) return NextResponse.json({ error: 'creatorId required' }, { status: 400 });

    const stats = await getDashboardStats(creatorId);
    return NextResponse.json(stats);
  } catch (err) {
    console.error('[GET analytics/dashboard]', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
