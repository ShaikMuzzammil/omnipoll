import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { pollDb, responseDb } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const polls = new Hono();

const createSchema = z.object({
  type: z.string(),
  question: z.string().min(1).max(500),
  options: z.array(z.any()).optional(),
  quizQuestions: z.array(z.any()).optional(),
  matrixRows: z.array(z.string()).optional(),
  matrixColumns: z.array(z.string()).optional(),
  lowLabel: z.string().optional(),
  highLabel: z.string().optional(),
  sliderMin: z.number().optional(),
  sliderMax: z.number().optional(),
  sliderStep: z.number().optional(),
  leftLabel: z.string().optional(),
  rightLabel: z.string().optional(),
  blankTemplate: z.string().optional(),
  matchLeft: z.array(z.string()).optional(),
  matchRight: z.array(z.string()).optional(),
  settings: z.record(z.any()).optional(),
  scheduledAt: z.string().optional(),
  duration: z.number().optional(),
});

// GET /api/polls - list user's polls
polls.get('/', authMiddleware, c => {
  const userId = c.get('userId');
  const pollList = pollDb.findByOwner(userId);
  return c.json({ polls: pollList });
});

// GET /api/polls/:id - get single poll
polls.get('/:id', authMiddleware, c => {
  const poll = pollDb.findById(c.req.param('id'));
  if (!poll) return c.json({ error: 'Poll not found' }, 404);
  return c.json({ poll });
});

// GET /api/polls/join/:code - join by code (public)
polls.get('/join/:code', c => {
  const poll = pollDb.findByJoinCode(c.req.param('code'));
  if (!poll) return c.json({ error: 'Poll not found' }, 404);
  // Omit sensitive data for participants
  const { ownerId, ...safePoll } = poll as any;
  return c.json({ poll: safePoll });
});

// POST /api/polls - create
polls.post('/', authMiddleware, zValidator('json', createSchema), c => {
  const userId = c.get('userId');
  const data = c.req.valid('json');
  const poll = pollDb.create({ ...data, ownerId: userId, status: 'draft' });
  return c.json({ poll }, 201);
});

// PATCH /api/polls/:id - update
polls.patch('/:id', authMiddleware, c => {
  const userId = c.get('userId');
  const poll = pollDb.findById(c.req.param('id'));
  if (!poll) return c.json({ error: 'Poll not found' }, 404);
  if (poll.ownerId !== userId) return c.json({ error: 'Forbidden' }, 403);
  // body parsed manually to allow partial updates
  return c.req.json().then(body => {
    const updated = pollDb.update(c.req.param('id'), body);
    return c.json({ poll: updated });
  });
});

// PATCH /api/polls/:id/status
polls.patch('/:id/status', authMiddleware, async c => {
  const userId = c.get('userId');
  const poll = pollDb.findById(c.req.param('id'));
  if (!poll) return c.json({ error: 'Poll not found' }, 404);
  if (poll.ownerId !== userId) return c.json({ error: 'Forbidden' }, 403);
  const { status } = await c.req.json();
  const updated = pollDb.update(c.req.param('id'), { status });
  return c.json({ poll: updated });
});

// DELETE /api/polls/:id
polls.delete('/:id', authMiddleware, c => {
  const userId = c.get('userId');
  const poll = pollDb.findById(c.req.param('id'));
  if (!poll) return c.json({ error: 'Poll not found' }, 404);
  if (poll.ownerId !== userId) return c.json({ error: 'Forbidden' }, 403);
  pollDb.delete(c.req.param('id'));
  return c.json({ success: true });
});

// GET /api/polls/:id/results - aggregated results
polls.get('/:id/results', c => {
  const poll = pollDb.findById(c.req.param('id'));
  if (!poll) return c.json({ error: 'Poll not found' }, 404);

  const resps = responseDb.getByPoll(poll.id);
  const results = aggregateResults(poll, resps);
  return c.json({ results, total: resps.length });
});

// POST /api/polls/:id/vote - submit a vote (REST fallback, Socket.IO preferred)
polls.post('/:id/vote', async c => {
  const poll = pollDb.findById(c.req.param('id'));
  if (!poll) return c.json({ error: 'Poll not found' }, 404);
  if (poll.status !== 'live') return c.json({ error: 'Poll is not live' }, 400);

  const body = await c.req.json();
  const response = responseDb.add(poll.id, {
    pollId: poll.id,
    answer: body.answer,
    participantName: body.participantName,
    deviceType: body.deviceType,
    responseTime: body.responseTime,
  });
  return c.json({ success: true, responseId: response.id }, 201);
});

// ─── Aggregation ────────────────────────────────────────────────
function aggregateResults(poll: any, resps: any[]) {
  const type = poll.type;
  const counts: Record<string, number> = {};
  let total = resps.length;

  if (['multiple_choice', 'image_choice', 'emoji_reaction', 'true_false', 'bracket', 'prioritization', 'countdown_vote'].includes(type)) {
    resps.forEach(r => {
      const ans = String(r.answer);
      counts[ans] = (counts[ans] || 0) + 1;
    });
    return { counts, total };
  }

  if (['word_cloud', 'open_text', 'qa', 'fill_blank'].includes(type)) {
    const words: Record<string, number> = {};
    const openResponses = resps.map(r => r.answer);
    if (type === 'word_cloud') {
      resps.forEach(r => {
        String(r.answer).split(/\s+/).filter(Boolean).forEach(w => {
          const word = w.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (word) words[word] = (words[word] || 0) + 1;
        });
      });
    }
    return { words, openResponses, total };
  }

  if (type === 'rating') {
    const ratings = resps.map(r => Number(r.answer));
    return { ratings, total };
  }

  if (type === 'nps') {
    const npsScores = resps.map(r => Number(r.answer));
    return { npsScores, total };
  }

  if (type === 'slider') {
    const sliderValues = resps.map(r => Number(r.answer));
    return { sliderValues, total };
  }

  if (type === 'ranking') {
    const rankingData: Record<string, number> = {};
    resps.forEach(r => {
      if (Array.isArray(r.answer)) {
        r.answer.forEach((item: string, idx: number) => {
          const pts = r.answer.length - idx;
          rankingData[item] = (rankingData[item] || 0) + pts;
        });
      }
    });
    return { rankingData, total };
  }

  if (type === 'matrix') {
    const matrixData: Record<string, Record<string, number>> = {};
    resps.forEach(r => {
      if (typeof r.answer === 'object') {
        Object.entries(r.answer).forEach(([row, col]) => {
          if (!matrixData[row]) matrixData[row] = {};
          matrixData[row][col as string] = (matrixData[row][col as string] || 0) + 1;
        });
      }
    });
    return { matrixData, total };
  }

  if (type === 'heatmap') {
    const heatmapPoints = resps.map(r => r.answer).filter(a => a?.x !== undefined);
    return { heatmapPoints, total };
  }

  if (type === 'live_matching') {
    const matchingData: Record<string, Record<string, number>> = {};
    resps.forEach(r => {
      if (typeof r.answer === 'object') {
        Object.entries(r.answer).forEach(([left, right]) => {
          if (!matchingData[left]) matchingData[left] = {};
          matchingData[left][right as string] = (matchingData[left][right as string] || 0) + 1;
        });
      }
    });
    return { matchingData, total };
  }

  if (type === 'quiz') {
    const quizResults: any[] = [];
    // Simplified — in production track per-question answers
    return { quizResults, total };
  }

  return { counts, total };
}

export { aggregateResults };
export default polls;
