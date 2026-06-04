import { createMiddleware } from 'hono/factory';
import { SignJWT, jwtVerify } from 'jose';
import { userDb } from '../db.js';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'omnipoll-super-secret-dev-key-change-in-prod');
const ALG = 'HS256';

export const signToken = async (payload: Record<string, string>, expiresIn = '7d') => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(SECRET);
};

export const verifyToken = async (token: string) => {
  const { payload } = await jwtVerify(token, SECRET);
  return payload;
};

export const authMiddleware = createMiddleware<{
  Variables: { userId: string; userPlan: string };
}>(async (c, next) => {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  try {
    const payload = await verifyToken(auth.slice(7)) as any;
    // Verify user still exists
    const user = userDb.findById(payload.sub);
    if (!user) return c.json({ error: 'User not found' }, 401);
    c.set('userId', payload.sub);
    c.set('userPlan', user.plan);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
});
