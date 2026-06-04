// In-memory store — swap for Prisma in production
// This keeps the dev experience zero-dependency

import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  plan: 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';
  createdAt: string;
}

export interface Poll {
  id: string;
  ownerId: string;
  type: string;
  question: string;
  status: 'draft' | 'live' | 'paused' | 'closed' | 'scheduled';
  joinCode: string;
  options?: any[];
  quizQuestions?: any[];
  matrixRows?: string[];
  matrixColumns?: string[];
  lowLabel?: string;
  highLabel?: string;
  sliderMin?: number;
  sliderMax?: number;
  sliderStep?: number;
  leftLabel?: string;
  rightLabel?: string;
  blankTemplate?: string;
  matchLeft?: string[];
  matchRight?: string[];
  settings?: Record<string, any>;
  scheduledAt?: string;
  duration?: number;
  participantCount: number;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Response {
  id: string;
  pollId: string;
  userId?: string;
  participantName?: string;
  answer: any;
  deviceType?: string;
  responseTime?: number;
  createdAt: string;
}

// ─── In-Memory Tables ───────────────────────────────────────────
const users = new Map<string, User>();
const polls = new Map<string, Poll>();
const responses = new Map<string, Response[]>();
const joinCodeIndex = new Map<string, string>(); // joinCode → pollId

// Seed a demo user
(async () => {
  const demoId = 'user_demo';
  users.set(demoId, {
    id: demoId,
    email: 'demo@omnipoll.io',
    name: 'Demo User',
    passwordHash: await bcrypt.hash('demo1234', 10),
    plan: 'PRO',
    createdAt: new Date().toISOString(),
  });

  // Seed demo polls
  const demoPollId = 'poll_demo1';
  const joinCode = 'DEMO01';
  polls.set(demoPollId, {
    id: demoPollId,
    ownerId: demoId,
    type: 'multiple_choice',
    question: 'What is your favorite feature of OmniPoll?',
    status: 'live',
    joinCode,
    options: [
      { text: 'Real-time live conducting' },
      { text: 'All 20 poll types' },
      { text: 'AI analytics' },
      { text: 'Beautiful design' },
    ],
    settings: { showResults: true, oneVote: true },
    participantCount: 42,
    responseCount: 38,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  joinCodeIndex.set(joinCode, demoPollId);
  responses.set(demoPollId, []);
})();

// ─── User DB ────────────────────────────────────────────────────
export const userDb = {
  findByEmail: (email: string) => [...users.values()].find(u => u.email === email),
  findById: (id: string) => users.get(id),
  create: async (data: { email: string; name: string; password: string }): Promise<User> => {
    const id = `user_${nanoid(12)}`;
    const user: User = {
      id,
      email: data.email,
      name: data.name,
      passwordHash: await bcrypt.hash(data.password, 10),
      plan: 'FREE',
      createdAt: new Date().toISOString(),
    };
    users.set(id, user);
    return user;
  },
};

// ─── Poll DB ────────────────────────────────────────────────────
export const pollDb = {
  findById: (id: string) => polls.get(id),
  findByJoinCode: (code: string) => {
    const pollId = joinCodeIndex.get(code.toUpperCase());
    return pollId ? polls.get(pollId) : undefined;
  },
  findByOwner: (ownerId: string) =>
    [...polls.values()].filter(p => p.ownerId === ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  create: (data: Omit<Poll, 'id' | 'joinCode' | 'participantCount' | 'responseCount' | 'createdAt' | 'updatedAt'>): Poll => {
    const id = `poll_${nanoid(12)}`;
    const joinCode = nanoid(8).toUpperCase();
    const now = new Date().toISOString();
    const poll: Poll = {
      ...data,
      id,
      joinCode,
      participantCount: 0,
      responseCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    polls.set(id, poll);
    joinCodeIndex.set(joinCode, id);
    responses.set(id, []);
    return poll;
  },
  update: (id: string, data: Partial<Poll>) => {
    const poll = polls.get(id);
    if (!poll) return null;
    const updated = { ...poll, ...data, updatedAt: new Date().toISOString() };
    polls.set(id, updated);
    return updated;
  },
  delete: (id: string) => {
    const poll = polls.get(id);
    if (poll) joinCodeIndex.delete(poll.joinCode);
    polls.delete(id);
    responses.delete(id);
  },
};

// ─── Response DB ────────────────────────────────────────────────
export const responseDb = {
  getByPoll: (pollId: string) => responses.get(pollId) ?? [],
  add: (pollId: string, data: Omit<Response, 'id' | 'createdAt'>) => {
    const id = `resp_${nanoid(12)}`;
    const response: Response = { ...data, id, pollId, createdAt: new Date().toISOString() };
    const list = responses.get(pollId) ?? [];
    list.push(response);
    responses.set(pollId, list);
    // Increment count
    const poll = polls.get(pollId);
    if (poll) polls.set(pollId, { ...poll, responseCount: poll.responseCount + 1, updatedAt: new Date().toISOString() });
    return response;
  },
  countByPoll: (pollId: string) => (responses.get(pollId) ?? []).length,
};
