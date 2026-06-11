import { NextRequest, NextResponse } from 'next/server';
import { getPollById, insertResponse, addParticipant, insertQuizSubmission } from '@/lib/db';
import { broadcastResults, broadcastParticipants } from '@/lib/pusher';
import { genId } from '@/lib/utils';
import { computeResults } from '../results/compute';

interface Params { params: { id: string } }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json() as Record<string, unknown>;
    const { participantId, participantName = 'Anonymous', answer, questionId, isCorrect, score } = body;

    if (!participantId) {
      return NextResponse.json({ error: 'participantId is required' }, { status: 400 });
    }

    const poll = await getPollById(params.id);
    if (!poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    if (poll.status !== 'live') return NextResponse.json({ error: 'Poll is not live' }, { status: 400 });

    // Enforce one-vote rule for non-quiz types
    if (poll.settings?.oneVote !== false && poll.type !== 'quiz' && poll.type !== 'qa') {
      const alreadyVoted = poll.responses.some((r) => r.participantId === participantId);
      if (alreadyVoted) {
        return NextResponse.json({ error: 'Already voted' }, { status: 409 });
      }
    }

    const responseId = genId();
    await insertResponse(
      responseId, params.id,
      String(participantId), String(participantName),
      answer, questionId ? String(questionId) : undefined,
      isCorrect !== undefined ? Boolean(isCorrect) : undefined,
      score !== undefined ? Number(score) : undefined
    );

    // Add participant
    await addParticipant(params.id, String(participantId));

    // For quiz submissions, also insert into quiz_submissions
    if (poll.type === 'quiz' && body.quizSubmission) {
      const sub = body.quizSubmission as Record<string, unknown>;
      await insertQuizSubmission(
        genId(), params.id, String(participantId), String(participantName),
        Number(sub.score || 0), Number(sub.correct || 0),
        Number(sub.answered || 0), sub.answers || []
      );
    }

    // Broadcast updated results via Pusher
    try {
      const updatedPoll = await getPollById(params.id);
      if (updatedPoll) {
        const results = computeResults(updatedPoll);
        await broadcastResults(params.id, results);
        await broadcastParticipants(params.id, updatedPoll.participants.length);
      }
    } catch (broadcastErr) {
      console.warn('[vote] Pusher broadcast failed:', broadcastErr);
    }

    return NextResponse.json({ success: true, responseId });
  } catch (err) {
    console.error('[POST vote]', err);
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}
