import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { userDb } from '../db.js';
import { signToken, authMiddleware } from '../middleware/auth.js';

const auth = new Hono();

const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(80),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// POST /api/auth/signup
auth.post('/signup', zValidator('json', signupSchema), async c => {
  const { email, name, password } = c.req.valid('json');

  if (userDb.findByEmail(email)) {
    return c.json({ error: 'Email already in use' }, 409);
  }

  const user = await userDb.create({ email, name, password });
  const token = await signToken({ sub: user.id, email: user.email });

  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
  }, 201);
});

// POST /api/auth/login
auth.post('/login', zValidator('json', loginSchema), async c => {
  const { email, password } = c.req.valid('json');
  const user = userDb.findByEmail(email);

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return c.json({ error: 'Invalid email or password' }, 401);
  }

  const token = await signToken({ sub: user.id, email: user.email });
  return c.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
  });
});

// GET /api/auth/me
auth.get('/me', authMiddleware, c => {
  const userId = c.get('userId');
  const user = userDb.findById(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json({ id: user.id, email: user.email, name: user.name, plan: user.plan });
});

// POST /api/auth/refresh
auth.post('/refresh', authMiddleware, async c => {
  const userId = c.get('userId');
  const user = userDb.findById(userId);
  if (!user) return c.json({ error: 'User not found' }, 404);
  const token = await signToken({ sub: user.id, email: user.email });
  return c.json({ token });
});

export default auth;
