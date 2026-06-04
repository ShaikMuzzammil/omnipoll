import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { Server as SocketServer } from 'socket.io';
import { createServer } from 'http';

import authRoutes from './routes/auth.js';
import pollRoutes from './routes/polls.js';
import analyticsRoutes from './routes/analytics.js';
import qaRoutes from './routes/qa.js';
import templateRoutes from './routes/templates.js';
import { registerSocketHandlers } from './socket.js';

const app = new Hono();

// ─── Middleware ─────────────────────────────────────────────────
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ─── Health ─────────────────────────────────────────────────────
app.get('/health', c => c.json({ status: 'ok', version: '2.0.0', ts: Date.now() }));
app.get('/', c => c.json({ name: 'OmniPoll API', version: '2.0.0' }));

// ─── Routes ─────────────────────────────────────────────────────
app.route('/api/auth', authRoutes);
app.route('/api/polls', pollRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/qa', qaRoutes);
app.route('/api/templates', templateRoutes);

// ─── 404 handler ────────────────────────────────────────────────
app.notFound(c => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error('[Error]', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

// ─── Socket.IO ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const httpServer = createServer();

const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

registerSocketHandlers(io);

// Attach Hono to the HTTP server
httpServer.on('request', serve({ fetch: app.fetch }));

httpServer.listen(PORT, () => {
  console.log(`\n🚀 OmniPoll Server v2.0.0`);
  console.log(`   HTTP  → http://localhost:${PORT}`);
  console.log(`   WS    → ws://localhost:${PORT}`);
  console.log(`   Env   → ${process.env.NODE_ENV ?? 'development'}\n`);
});

export default app;
