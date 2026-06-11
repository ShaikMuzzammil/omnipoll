import Pusher from 'pusher';

let _pusher: Pusher | null = null;

export function getPusher(): Pusher {
  if (_pusher) return _pusher;

  if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY ||
      !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
    throw new Error('Pusher environment variables are not configured');
  }

  _pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });

  return _pusher;
}

/** Trigger a real-time results update to all subscribers of a poll */
export async function broadcastResults(pollId: string, results: unknown) {
  try {
    await getPusher().trigger(`poll-${pollId}`, 'results-update', results);
  } catch (err) {
    console.error('[Pusher] broadcastResults failed:', err);
  }
}

/** Broadcast a status change (live/paused/closed) */
export async function broadcastStatus(pollId: string, status: string) {
  try {
    await getPusher().trigger(`poll-${pollId}`, 'status-changed', { status });
  } catch (err) {
    console.error('[Pusher] broadcastStatus failed:', err);
  }
}

/** Broadcast updated Q&A questions */
export async function broadcastQA(pollId: string, questions: unknown[]) {
  try {
    await getPusher().trigger(`poll-${pollId}`, 'qa-update', { questions });
  } catch (err) {
    console.error('[Pusher] broadcastQA failed:', err);
  }
}

/** Broadcast participant count update */
export async function broadcastParticipants(pollId: string, count: number) {
  try {
    await getPusher().trigger(`poll-${pollId}`, 'participant-joined', { count });
  } catch (err) {
    console.error('[Pusher] broadcastParticipants failed:', err);
  }
}
