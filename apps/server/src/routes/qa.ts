import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';

const qa = new Hono();

// In-memory Q&A store (per-poll)
const qaStore = new Map<string, any[]>();

qa.get('/:pollId', authMiddleware, c => {
  const { pollId } = c.req.param();
  return c.json({ questions: qaStore.get(pollId) ?? [] });
});

qa.post('/:pollId', async c => {
  const { pollId } = c.req.param();
  const { question, participantName } = await c.req.json();
  const q = {
    id: Date.now().toString(),
    text: question,
    author: participantName || 'Anonymous',
    upvotes: 0,
    status: 'pending',
    aiScore: Math.floor(60 + Math.random() * 40),
    createdAt: new Date().toISOString(),
  };
  const list = qaStore.get(pollId) ?? [];
  list.push(q);
  qaStore.set(pollId, list);
  return c.json({ question: q }, 201);
});

qa.patch('/:pollId/:questionId/status', authMiddleware, async c => {
  const { pollId, questionId } = c.req.param();
  const { status } = await c.req.json();
  const list = qaStore.get(pollId) ?? [];
  const q = list.find(q => q.id === questionId);
  if (!q) return c.json({ error: 'Not found' }, 404);
  q.status = status;
  return c.json({ question: q });
});

qa.post('/:pollId/:questionId/upvote', c => {
  const { pollId, questionId } = c.req.param();
  const list = qaStore.get(pollId) ?? [];
  const q = list.find(q => q.id === questionId);
  if (!q) return c.json({ error: 'Not found' }, 404);
  q.upvotes++;
  return c.json({ upvotes: q.upvotes });
});

export default qa;
