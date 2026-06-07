/// <reference types="../vite-env.d.ts" />

// On Vercel: API is at same domain (/api/*), no base URL needed
// For local dev: set VITE_API_URL=http://localhost:3000
const BASE = (import.meta.env.VITE_API_URL as string) || "";

function getToken() {
  try { return JSON.parse(localStorage.getItem("omnipoll_auth") || "null")?.token || ""; }
  catch { return ""; }
}

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// Auth
export const signUp  = (body: { name: string; email: string; password: string }) =>
  apiFetch("/api/auth/signup", { method: "POST", body: JSON.stringify(body) });
export const signup  = signUp;
export const signIn  = (body: { email: string; password: string }) =>
  apiFetch("/api/auth/signin", { method: "POST", body: JSON.stringify(body) });
export const login   = signIn;

// Polls
export const createPoll       = (body: Record<string, unknown>) =>
  apiFetch("/api/polls", { method: "POST", body: JSON.stringify(body) });
export const getPolls         = (creatorId?: string) =>
  apiFetch(`/api/polls${creatorId ? `?creatorId=${creatorId}` : ""}`);
export const listPolls        = getPolls;
export const getPoll          = (id: string) => apiFetch(`/api/polls/${id}`);
export const joinByCode       = (code: string) => apiFetch(`/api/polls/join/${code}`);
export const getPollByCode    = joinByCode;
export const vote             = (id: string, body: Record<string, unknown>) =>
  apiFetch(`/api/polls/${id}/vote`, { method: "POST", body: JSON.stringify(body) });
export const getResults       = (id: string) => apiFetch(`/api/polls/${id}/results`);
export const updatePollStatus = (id: string, status: string) =>
  apiFetch(`/api/polls/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
export const updatePoll       = (id: string, body: Record<string, unknown>) =>
  apiFetch(`/api/polls/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const deletePoll       = (id: string) =>
  apiFetch(`/api/polls/${id}`, { method: "DELETE" });

// Lifecycle (trigger Pusher via REST)
export const goLive   = (id: string) => apiFetch(`/api/polls/${id}/go-live`, { method: "POST" });
export const pausePoll = (id: string) => apiFetch(`/api/polls/${id}/pause`,   { method: "POST" });
export const endPoll  = (id: string) => apiFetch(`/api/polls/${id}/end`,     { method: "POST" });

// Q&A
export const addQAQuestion     = (id: string, body: { text: string; author: string }) =>
  apiFetch(`/api/polls/${id}/qa/question`, { method: "POST", body: JSON.stringify(body) });
export const upvoteQAQuestion  = (id: string, questionId: string) =>
  apiFetch(`/api/polls/${id}/qa/${questionId}/upvote`, { method: "POST" });
export const moderateQAQuestion = (id: string, questionId: string, body: Record<string, unknown>) =>
  apiFetch(`/api/polls/${id}/qa/${questionId}`, { method: "PATCH", body: JSON.stringify(body) });

// Analytics
export const getAnalytics     = (id: string) => apiFetch(`/api/polls/${id}/analytics`);
export const getDashboardStats = (creatorId: string) =>
  apiFetch(`/api/polls?creatorId=${creatorId}`);

// Export
export const csvExportUrl    = (id: string) => `${BASE}/api/polls/${id}/export/csv`;
export const participantUrl  = (code: string) =>
  typeof window !== "undefined" ? `${window.location.origin}/participate/${code}` : `/participate/${code}`;

// Session helpers
const SESSION_KEY = "omnipoll_session";
export function readSession(): Record<string, unknown> | null {
  try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem("omnipoll_auth");
}
export function writeSession(data: Record<string, unknown>): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}
