'use client';

async function api(path: string, opts: RequestInit = {}): Promise<unknown> {
  let token = '';
  try { token = JSON.parse(localStorage.getItem('omnipoll_auth') || 'null')?.token || ''; } catch { /* */ }
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers as Record<string, string> || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const signUp = (body: { name: string; email: string; password: string }) =>
  api('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) });
export const signIn = (body: { email: string; password: string }) =>
  api('/api/auth/signin', { method: 'POST', body: JSON.stringify(body) });
export const createPoll = (body: Record<string, unknown>) =>
  api('/api/polls', { method: 'POST', body: JSON.stringify(body) });
export const getPolls = (creatorId?: string) =>
  api(`/api/polls${creatorId ? `?creatorId=${creatorId}` : ''}`);
export const getPoll = (id: string) => api(`/api/polls/${id}`);
export const joinByCode = (code: string) => api(`/api/join?code=${code}`);
export const vote = (id: string, body: Record<string, unknown>) =>
  api(`/api/polls/${id}/vote`, { method: 'POST', body: JSON.stringify(body) });
export const getResults = (id: string) => api(`/api/polls/${id}/results`);
export const updatePollStatus = (id: string, status: string) =>
  api(`/api/polls/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deletePoll = (id: string) =>
  api(`/api/polls/${id}`, { method: 'DELETE' });
export const updatePoll = (id: string, body: Record<string, unknown>) =>
  api(`/api/polls/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const addQAQuestion = (id: string, body: { questionText: string; participantId: string }) =>
  api(`/api/polls/${id}/qa`, { method: 'POST', body: JSON.stringify(body) });
export const upvoteQAQuestion = (id: string, questionId: string) =>
  api(`/api/polls/${id}/qa/${questionId}/upvote`, { method: 'PUT' });
export const getDashboardStats = (creatorId: string) =>
  api(`/api/analytics/dashboard?creatorId=${creatorId}`);

export function getParticipantId(): string {
  try {
    let pid = localStorage.getItem('omnipoll_pid');
    if (!pid) {
      const arr = new Uint8Array(12);
      crypto.getRandomValues(arr);
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789';
      pid = Array.from(arr, (b) => chars[b % chars.length]).join('');
      localStorage.setItem('omnipoll_pid', pid);
    }
    return pid;
  } catch { return 'anon-' + Math.random().toString(36).slice(2); }
}
