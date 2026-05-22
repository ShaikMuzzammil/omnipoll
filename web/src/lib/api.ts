// OmniPoll API client
const BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ── Auth ────────────────────────────────────────────────────
export const signUp = (body: { name: string; email: string; password: string }) =>
  apiFetch("/api/auth/signup", { method: "POST", body: JSON.stringify(body) });

/** Alias for signUp — backward compatibility */
export const signup = signUp;

export const signIn = (body: { email: string; password: string }) =>
  apiFetch("/api/auth/signin", { method: "POST", body: JSON.stringify(body) });

/** Alias for signIn */
export const login = signIn;

// ── Polls ───────────────────────────────────────────────────
export const createPoll = (body: Record<string, unknown>) =>
  apiFetch("/api/polls", { method: "POST", body: JSON.stringify(body) });

export const getPolls = (creatorId?: string) =>
  apiFetch(`/api/polls${creatorId ? `?creatorId=${creatorId}` : ""}`);

/** Alias for getPolls — backward compatibility */
export const listPolls = getPolls;

export const getPoll = (id: string) => apiFetch(`/api/polls/${id}`);

export const joinByCode = (code: string) => apiFetch(`/api/join?code=${code}`);

export const vote = (id: string, body: Record<string, unknown>) =>
  apiFetch(`/api/polls/${id}/vote`, { method: "POST", body: JSON.stringify(body) });

export const getResults = (id: string) => apiFetch(`/api/polls/${id}/results`);

export const updatePollStatus = (id: string, status: string) =>
  apiFetch(`/api/polls/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const deletePoll = (id: string) =>
  apiFetch(`/api/polls/${id}`, { method: "DELETE" });

export const updatePoll = (id: string, body: Record<string, unknown>) =>
  apiFetch(`/api/polls/${id}`, { method: "PUT", body: JSON.stringify(body) });

// ── Q&A ─────────────────────────────────────────────────────
export const addQAQuestion = (
  id: string,
  body: { questionText: string; participantId: string }
) => apiFetch(`/api/polls/${id}/qa`, { method: "POST", body: JSON.stringify(body) });

export const upvoteQAQuestion = (id: string, questionId: string) =>
  apiFetch(`/api/polls/${id}/qa/${questionId}/upvote`, { method: "PUT" });

export const moderateQAQuestion = (
  id: string,
  questionId: string,
  action: "answer" | "highlight" | "dismiss"
) =>
  apiFetch(`/api/polls/${id}/qa/${questionId}/moderate`, {
    method: "PATCH",
    body: JSON.stringify({ action }),
  });

// ── Quiz ─────────────────────────────────────────────────────
export const submitQuizAnswer = (id: string, body: Record<string, unknown>) =>
  apiFetch(`/api/polls/${id}/quiz/submit`, { method: "POST", body: JSON.stringify(body) });

export const getLeaderboard = (id: string) =>
  apiFetch(`/api/polls/${id}/quiz/leaderboard`);

// ── Export ───────────────────────────────────────────────────
export const csvExportUrl = (id: string) => `${BASE}/api/polls/${id}/export/csv`;

export const participantUrl = (code: string) =>
  `${window.location.origin}${window.location.pathname.replace(/\/$/, "")}/poll/${code}`;
