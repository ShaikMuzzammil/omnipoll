import { Hono } from 'hono';
import { pollDb, responseDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { subDays, format } from 'date-fns';

const analytics = new Hono();

// GET /api/analytics/:pollId
analytics.get('/:pollId', authMiddleware, c => {
  const { pollId } = c.req.param();
  const poll = pollDb.findById(pollId);
  if (!poll) return c.json({ error: 'Poll not found' }, 404);
  if (poll.ownerId !== c.get('userId')) return c.json({ error: 'Forbidden' }, 403);

  const resps = responseDb.getByPoll(pollId);
  const participants = poll.participantCount;
  const responseRate = participants > 0 ? Math.round((resps.length / participants) * 100) : 0;
  const avgTime = resps.length
    ? Math.round(resps.filter(r => r.responseTime).reduce((a, r) => a + (r.responseTime || 0), 0) / resps.length / 1000)
    : 0;

  // Fake time-series for demo
  const overTime = Array.from({ length: 12 }, (_, i) => ({
    time: format(subDays(new Date(), 11 - i), 'MMM d'),
    responses: Math.floor(Math.random() * 30),
    participants: Math.floor(Math.random() * 40),
  }));

  return c.json({
    participants,
    responses: resps.length,
    responseRate,
    avgTime,
    overTime,
  });
});

// GET /api/analytics/dashboard - summary across all polls
analytics.get('/dashboard/summary', authMiddleware, c => {
  const userId = c.get('userId');
  const userPolls = pollDb.findByOwner(userId);
  const totalParticipants = userPolls.reduce((a, p) => a + p.participantCount, 0);
  const totalResponses = userPolls.reduce((a, p) => a + p.responseCount, 0);
  const livePolls = userPolls.filter(p => p.status === 'live').length;

  return c.json({ totalPolls: userPolls.length, totalParticipants, totalResponses, livePolls });
});

export default analytics;
