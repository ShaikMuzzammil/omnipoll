import type { Server, Socket } from 'socket.io';
import { pollDb, responseDb } from './db.js';
import { aggregateResults } from './routes/polls.js';

interface ParticipantMap {
  [pollId: string]: Set<string>; // socket IDs
}

const participants: ParticipantMap = {};
const timers: Map<string, NodeJS.Timeout> = new Map();

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ─── HOST ────────────────────────────────────────────────────
    socket.on('host-join', ({ pollId }) => {
      socket.join(`poll:${pollId}:host`);
      socket.join(`poll:${pollId}`);
      console.log(`[Socket] Host joined poll ${pollId}`);
      // Send current results
      emitResults(io, pollId);
    });

    socket.on('go-live', ({ pollId }) => {
      pollDb.update(pollId, { status: 'live' });
      io.to(`poll:${pollId}`).emit('poll-status-changed', { status: 'live' });
      console.log(`[Socket] Poll ${pollId} went live`);
      // Start timer if duration set
      const poll = pollDb.findById(pollId);
      if (poll?.duration) startTimer(io, pollId, poll.duration);
    });

    socket.on('pause-poll', ({ pollId }) => {
      pollDb.update(pollId, { status: 'paused' });
      io.to(`poll:${pollId}`).emit('poll-status-changed', { status: 'paused' });
      clearTimer(pollId);
    });

    socket.on('close-poll', ({ pollId }) => {
      pollDb.update(pollId, { status: 'closed' });
      io.to(`poll:${pollId}`).emit('poll-closed', { pollId });
      clearTimer(pollId);
      // Cleanup participants
      delete participants[pollId];
    });

    socket.on('reveal-results', ({ pollId }) => {
      emitResults(io, pollId);
    });

    // ─── PARTICIPANT ─────────────────────────────────────────────
    socket.on('join-poll', ({ pollId, participantName }) => {
      const poll = pollDb.findById(pollId);
      if (!poll) {
        socket.emit('error', { message: 'Poll not found' });
        return;
      }
      socket.join(`poll:${pollId}`);
      if (!participants[pollId]) participants[pollId] = new Set();
      participants[pollId].add(socket.id);

      // Increment participant count
      const count = participants[pollId].size;
      pollDb.update(pollId, { participantCount: count });

      io.to(`poll:${pollId}`).emit('participant-joined', { count, name: participantName });
      socket.emit('poll-joined', { poll });
      console.log(`[Socket] ${participantName || 'Anonymous'} joined poll ${pollId} (${count} total)`);
    });

    socket.on('submit-vote', ({ pollId, answer, participantName, responseTime }) => {
      const poll = pollDb.findById(pollId);
      if (!poll || poll.status !== 'live') {
        socket.emit('vote-error', { message: 'Poll is not active' });
        return;
      }

      const response = responseDb.add(pollId, {
        pollId,
        answer,
        participantName,
        responseTime,
        deviceType: detectDevice(socket),
      });

      socket.emit('vote-accepted', { responseId: response.id });
      console.log(`[Socket] Vote received for poll ${pollId}`);
      emitResults(io, pollId);
    });

    // Q&A specific
    socket.on('submit-question', ({ pollId, question, participantName }) => {
      io.to(`poll:${pollId}:host`).emit('new-question', {
        id: Date.now().toString(),
        text: question,
        author: participantName || 'Anonymous',
        time: new Date().toISOString(),
        upvotes: 0,
        status: 'pending',
        aiScore: Math.floor(60 + Math.random() * 40),
      });
      socket.emit('question-submitted');
    });

    socket.on('upvote-question', ({ pollId, questionId }) => {
      io.to(`poll:${pollId}`).emit('question-upvoted', { questionId });
    });

    socket.on('approve-question', ({ pollId, questionId }) => {
      io.to(`poll:${pollId}`).emit('question-approved', { questionId });
    });

    // ─── DISCONNECT ──────────────────────────────────────────────
    socket.on('disconnecting', () => {
      // Find which polls this socket was in
      socket.rooms.forEach(room => {
        const match = room.match(/^poll:([^:]+)$/);
        if (match) {
          const pollId = match[1];
          if (participants[pollId]) {
            participants[pollId].delete(socket.id);
            const count = participants[pollId].size;
            pollDb.update(pollId, { participantCount: count });
            io.to(`poll:${pollId}`).emit('participant-left', { count });
          }
        }
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
}

// ─── Helpers ─────────────────────────────────────────────────────
function emitResults(io: Server, pollId: string) {
  const poll = pollDb.findById(pollId);
  if (!poll) return;
  const resps = responseDb.getByPoll(pollId);
  const results = aggregateResults(poll, resps);
  io.to(`poll:${pollId}`).emit('results-update', results);
}

function startTimer(io: Server, pollId: string, duration: number) {
  let remaining = duration;
  const timer = setInterval(() => {
    remaining--;
    io.to(`poll:${pollId}`).emit('time-update', { timeLeft: remaining });
    if (remaining <= 0) {
      clearTimer(pollId);
      pollDb.update(pollId, { status: 'closed' });
      io.to(`poll:${pollId}`).emit('poll-closed', { pollId });
    }
  }, 1000);
  timers.set(pollId, timer);
}

function clearTimer(pollId: string) {
  const t = timers.get(pollId);
  if (t) { clearInterval(t); timers.delete(pollId); }
}

function detectDevice(socket: Socket): string {
  const ua = (socket.handshake.headers['user-agent'] || '').toLowerCase();
  if (/mobile|android|iphone|ipad/.test(ua)) return 'mobile';
  if (/tablet/.test(ua)) return 'tablet';
  return 'desktop';
}
