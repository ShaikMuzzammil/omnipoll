import type { Poll, PollResults, PollStatus, User } from "@/lib/types";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8787").replace(/\/$/, "");

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }
  return data as T;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  const participantId = getParticipantId();
  headers.set("X-Participant-Id", participantId);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(`Unable to reach the OmniPoll API at ${API_URL}. Run npm run dev, or update VITE_API_URL and CLIENT_ORIGIN.`);
  }
  return parseResponse<T>(response);
}

export function getParticipantId() {
  const key = "omnipoll_participant_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const generated = `participant_${crypto.randomUUID()}`;
  localStorage.setItem(key, generated);
  return generated;
}

export function saveSession(user: User) {
  localStorage.setItem("omnipoll_user", JSON.stringify(user));
}

export function readSession(): User | null {
  const raw = localStorage.getItem("omnipoll_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    localStorage.removeItem("omnipoll_user");
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("omnipoll_user");
}

export async function signup(payload: { name: string; email: string; password: string }) {
  const data = await apiRequest<{ user: User }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  saveSession(data.user);
  return data.user;
}

export async function login(payload: { email: string; password: string }) {
  const data = await apiRequest<{ user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  saveSession(data.user);
  return data.user;
}

export async function listPolls(creatorId?: string) {
  const query = creatorId ? `?creatorId=${encodeURIComponent(creatorId)}` : "";
  return apiRequest<{ polls: Poll[] }>(`/api/polls${query}`);
}

export async function createPoll(payload: Partial<Poll> & { creatorId: string }) {
  return apiRequest<{ poll: Poll; results: PollResults }>("/api/polls", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPoll(id: string) {
  return apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/${encodeURIComponent(id)}`);
}

export async function getPollByCode(code: string) {
  return apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/code/${encodeURIComponent(code)}`);
}

export async function submitVote(pollId: string, answer: Record<string, unknown>) {
  return apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/${encodeURIComponent(pollId)}/vote`, {
    method: "POST",
    body: JSON.stringify({ participantId: getParticipantId(), answer }),
  });
}

export async function addQuestion(pollId: string, questionText: string) {
  return apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/${encodeURIComponent(pollId)}/qa`, {
    method: "POST",
    body: JSON.stringify({ participantId: getParticipantId(), questionText }),
  });
}

export async function upvoteQuestion(pollId: string, questionId: string) {
  return apiRequest<{ poll: Poll; results: PollResults }>(
    `/api/polls/${encodeURIComponent(pollId)}/qa/${encodeURIComponent(questionId)}/upvote`,
    {
      method: "PUT",
      body: JSON.stringify({ participantId: getParticipantId() }),
    },
  );
}

export async function submitQuizAnswer(
  pollId: string,
  payload: { questionId: string; selectedAnswer: string; participantName: string },
) {
  return apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/${encodeURIComponent(pollId)}/quiz/submit`, {
    method: "POST",
    body: JSON.stringify({ participantId: getParticipantId(), ...payload }),
  });
}

export async function updatePollStatus(pollId: string, status: PollStatus) {
  return apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/${encodeURIComponent(pollId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deletePoll(pollId: string) {
  return apiRequest<{ ok: boolean }>(`/api/polls/${encodeURIComponent(pollId)}`, {
    method: "DELETE",
  });
}

export function csvExportUrl(pollId: string) {
  return `${API_URL}/api/polls/${encodeURIComponent(pollId)}/export/csv`;
}

export function participantUrl(code: string) {
  return `${window.location.origin}/p/${encodeURIComponent(code)}`;
}
