const BASE = '/api';

function getToken(): string {
  try { return JSON.parse(localStorage.getItem('omnipoll_auth') || 'null')?.token || ''; }
  catch { return ''; }
}

async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({ error: r.statusText })) as { error?: string };
    throw new Error(e.error || 'Request failed');
  }
  return r.json();
}

export const signUp = (b: { name: string; email: string; password: string }) =>
  api('/auth/signup', { method: 'POST', body: JSON.stringify(b) });
export const signIn = (b: { email: string; password: string }) =>
  api('/auth/signin', { method: 'POST', body: JSON.stringify(b) });
export const createPoll = (b: Record<string, unknown>) =>
  api('/polls', { method: 'POST', body: JSON.stringify(b) });
export const listPolls = (creatorId?: string) =>
  api(`/polls${creatorId ? `?creatorId=${creatorId}` : ''}`);
export const getPoll = (id: string) => api(`/polls/${id}`);
export const joinByCode = (code: string) => api(`/join?code=${code}`);
export const vote = (id: string, b: Record<string, unknown>) =>
  api(`/polls/${id}/vote`, { method: 'POST', body: JSON.stringify(b) });
export const getResults = (id: string) => api(`/polls/${id}/results`);
export const updatePollStatus = (id: string, status: string) =>
  api(`/polls/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
export const deletePoll = (id: string) =>
  api(`/polls/${id}`, { method: 'DELETE' });
export const addQAQuestion = (id: string, b: { questionText: string; participantId: string }) =>
  api(`/polls/${id}/qa`, { method: 'POST', body: JSON.stringify(b) });
export const upvoteQA = (id: string, qid: string) =>
  api(`/polls/${id}/qa/${qid}/upvote`, { method: 'PUT' });
export const getDashboardStats = (creatorId: string) =>
  api(`/analytics/dashboard?creatorId=${creatorId}`);

export function getParticipantId(): string {
  try {
    let pid = localStorage.getItem('omnipoll_pid');
    if (!pid) {
      const arr = new Uint8Array(12);
      crypto.getRandomValues(arr);
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789';
      pid = Array.from(arr, b => chars[b % chars.length]).join('');
      localStorage.setItem('omnipoll_pid', pid);
    }
    return pid;
  } catch { return 'anon-' + Math.random().toString(36).slice(2); }
}
