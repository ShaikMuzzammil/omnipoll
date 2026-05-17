import type { Poll, PollResults, PollStatus, User, PollType } from "@/lib/types";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8787").replace(/\/$/, "");
const LOCAL_USERS_KEY = "omnipoll_local_users";
const LOCAL_POLLS_KEY = "omnipoll_local_polls";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function apiUsesLocalhost() {
  try {
    return LOCAL_HOSTS.has(new URL(API_URL).hostname);
  } catch {
    return false;
  }
}

export function isLocalOnlyMode() {
  return isBrowser() && apiUsesLocalhost() && !LOCAL_HOSTS.has(window.location.hostname);
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (isBrowser()) localStorage.setItem(key, JSON.stringify(value));
}

function id(prefix: string) {
  const random = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `${prefix}_${random}`;
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function nameFromIdentifier(identifier: string) {
  const value = identifier.trim();
  if (!value) return "Presenter";
  return value.includes("@") ? value.split("@")[0] || "Presenter" : value;
}

function saveLocalUser(name: string, identifier: string) {
  const users = readJson<User[]>(LOCAL_USERS_KEY, []);
  const email = identifier.trim() || `${normalize(name) || "presenter"}@local.omnipoll`;
  const userName = name.trim() || nameFromIdentifier(email);
  const existingIndex = users.findIndex(
    (user) => normalize(user.email) === normalize(email) || normalize(user.name) === normalize(userName),
  );
  const existing = existingIndex >= 0 ? users[existingIndex] : null;
  const user: User = {
    id: existing?.id || id("user"),
    email,
    name: userName,
    provider: "email",
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  if (existingIndex >= 0) users[existingIndex] = user;
  else users.push(user);
  writeJson(LOCAL_USERS_KEY, users);
  saveSession(user);
  return user;
}

function loginLocalUser(identifier: string) {
  const users = readJson<User[]>(LOCAL_USERS_KEY, []);
  const key = normalize(identifier);
  const existing = users.find((user) => normalize(user.email) === key || normalize(user.name) === key);
  if (existing) {
    saveSession(existing);
    return existing;
  }
  const name = nameFromIdentifier(identifier);
  const email = identifier.includes("@") ? identifier.trim() : `${normalize(name) || "presenter"}@local.omnipoll`;
  return saveLocalUser(name, email);
}

function readLocalPolls() {
  return readJson<Poll[]>(LOCAL_POLLS_KEY, []);
}

function writeLocalPolls(polls: Poll[]) {
  writeJson(LOCAL_POLLS_KEY, polls);
}

function generateJoinCode(polls: Poll[]) {
  const existing = new Set(polls.map((poll) => normalize(poll.code)));
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = "";
    for (let i = 0; i < 6; i += 1) code += chars[Math.floor(Math.random() * chars.length)];
    if (!existing.has(normalize(code))) return code;
  }
  return id("code").slice(-6).toUpperCase();
}

function findLocalPollIndex(polls: Poll[], idOrCode: string) {
  const key = normalize(idOrCode);
  return polls.findIndex((poll) => poll.id === idOrCode || normalize(poll.code) === key);
}

function participantCount(poll: Poll) {
  const ids = new Set<string>();
  poll.responses?.forEach((response) => ids.add(response.participantId));
  poll.qnaQuestions?.forEach((question) => question.participantId && ids.add(question.participantId));
  poll.quizSubmissions?.forEach((submission) => ids.add(submission.participantId));
  return ids.size;
}

function buildLocalResults(poll: Poll): PollResults {
  const base = {
    pollId: poll.id,
    code: poll.code,
    type: poll.type,
    status: poll.status,
    totalResponses: poll.type === "qa" ? poll.qnaQuestions?.length || 0 : poll.type === "quiz" ? poll.quizSubmissions?.length || 0 : poll.responses?.length || 0,
    participants: participantCount(poll),
    updatedAt: new Date().toISOString(),
  };

  if (poll.type === "multiple_choice") {
    const totalVotes = (poll.options || []).reduce((sum, option) => sum + (option.votes || 0), 0);
    return {
      ...base,
      totalVotes,
      options: (poll.options || []).map((option) => ({
        ...option,
        votes: option.votes || 0,
        pct: totalVotes ? Math.round(((option.votes || 0) / totalVotes) * 1000) / 10 : 0,
      })),
    };
  }

  if (poll.type === "qa") {
    return { ...base, questions: [...(poll.qnaQuestions || [])].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)) };
  }

  if (poll.type === "quiz") {
    return {
      ...base,
      questions: poll.quizQuestions || [],
      submissions: poll.quizSubmissions || [],
      leaderboard: [],
    };
  }

  if (poll.type === "word_cloud") {
    const words = new Map<string, number>();
    const responses = (poll.responses || []).map((response) => String(response.answer?.text || "")).filter(Boolean);
    responses.forEach((text) => words.set(text, (words.get(text) || 0) + 1));
    return {
      ...base,
      words: Array.from(words.entries()).map(([text, count]) => ({ text, count })),
      responses: responses.map((text, index) => ({ id: poll.responses?.[index]?.id, text })),
    };
  }

  if (poll.type === "rating") {
    const values = (poll.responses || []).map((response) => Number(response.answer?.rating)).filter(Number.isFinite);
    const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    return { ...base, values, average, distribution: {} };
  }

  return base;
}

function shouldUseLocalFallback(error: unknown) {
  return isLocalOnlyMode() || (error instanceof Error && error.name === "ApiConnectionError");
}

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
    const error = new Error(`Unable to reach the OmniPoll API at ${API_URL}. Run npm run dev, or update VITE_API_URL and CLIENT_ORIGIN.`);
    error.name = "ApiConnectionError";
    throw error;
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
  void payload.password;
  return saveLocalUser(payload.name, payload.email);
}

export async function login(payload: { email: string; password: string }) {
  void payload.password;
  return loginLocalUser(payload.email);
}

export async function listPolls(creatorId?: string) {
  if (isLocalOnlyMode()) {
    const polls = readLocalPolls()
      .filter((poll) => !creatorId || poll.creatorId === creatorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { polls };
  }
  const query = creatorId ? `?creatorId=${encodeURIComponent(creatorId)}` : "";
  try {
    return await apiRequest<{ polls: Poll[] }>(`/api/polls${query}`);
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return { polls: readLocalPolls().filter((poll) => !creatorId || poll.creatorId === creatorId) };
  }
}

export async function createPoll(payload: Partial<Poll> & { creatorId: string }) {
  const createLocal = () => {
    const polls = readLocalPolls();
    const now = new Date().toISOString();
    const type = (payload.type || "multiple_choice") as PollType;
    const poll: Poll = {
      id: id("poll"),
      creatorId: payload.creatorId,
      title: String(payload.title || payload.question || "Untitled poll").trim(),
      question: String(payload.question || payload.title || "Untitled poll").trim(),
      description: payload.description || "",
      category: payload.category || "General",
      type,
      status: (payload.status || "live") as PollStatus,
      code: payload.code || generateJoinCode(polls),
      createdAt: now,
      updatedAt: now,
      expiresAt: payload.expiresAt || null,
      settings: payload.settings || {},
      options: (payload.options || []).map((option, index) => ({
        id: option.id || id("opt"),
        text: option.text,
        order: option.order ?? index,
        votes: option.votes || 0,
      })),
      responses: [],
      qnaQuestions: [],
      quizQuestions: (payload.quizQuestions || []).map((question, index) => ({
        ...question,
        id: question.id || id("quizq"),
        pollId: "",
        order: question.order ?? index,
      })),
      quizSubmissions: [],
    };
    poll.quizQuestions = poll.quizQuestions?.map((question) => ({ ...question, pollId: poll.id }));
    writeLocalPolls([poll, ...polls]);
    return { poll, results: buildLocalResults(poll) };
  };

  if (isLocalOnlyMode()) return createLocal();
  try {
    return await apiRequest<{ poll: Poll; results: PollResults }>("/api/polls", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return createLocal();
  }
}

export async function getPoll(id: string) {
  const getLocal = () => {
    const polls = readLocalPolls();
    const index = findLocalPollIndex(polls, id);
    if (index === -1) throw new Error("Poll not found.");
    const poll = polls[index];
    return { poll, results: buildLocalResults(poll) };
  };

  if (isLocalOnlyMode()) return getLocal();
  try {
    return await apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/${encodeURIComponent(id)}`);
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return getLocal();
  }
}

export async function getPollByCode(code: string) {
  const getLocal = () => {
    const polls = readLocalPolls();
    const index = findLocalPollIndex(polls, code);
    if (index === -1) throw new Error("Poll not found.");
    const poll = polls[index];
    return { poll, results: buildLocalResults(poll) };
  };

  if (isLocalOnlyMode()) return getLocal();
  try {
    return await apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/code/${encodeURIComponent(code)}`);
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return getLocal();
  }
}

export async function submitVote(pollId: string, answer: Record<string, unknown>) {
  const submitLocal = () => {
    const polls = readLocalPolls();
    const index = findLocalPollIndex(polls, pollId);
    if (index === -1) throw new Error("Poll not found.");
    const poll = polls[index];
    const response = { id: id("response"), pollId: poll.id, participantId: getParticipantId(), answer, createdAt: new Date().toISOString() };
    if (poll.type === "multiple_choice") {
      const selectedIds = Array.isArray(answer.optionIds) ? answer.optionIds : [answer.optionId].filter(Boolean);
      poll.options = (poll.options || []).map((option) => selectedIds.includes(option.id) ? { ...option, votes: (option.votes || 0) + 1 } : option);
    }
    poll.responses = [response, ...(poll.responses || [])];
    poll.updatedAt = new Date().toISOString();
    polls[index] = poll;
    writeLocalPolls(polls);
    return { poll, results: buildLocalResults(poll) };
  };

  if (isLocalOnlyMode()) return submitLocal();
  try {
    return await apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/${encodeURIComponent(pollId)}/vote`, {
      method: "POST",
      body: JSON.stringify({ participantId: getParticipantId(), answer }),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return submitLocal();
  }
}

export async function addQuestion(pollId: string, questionText: string) {
  const addLocal = () => {
    const polls = readLocalPolls();
    const index = findLocalPollIndex(polls, pollId);
    if (index === -1) throw new Error("Poll not found.");
    const poll = polls[index];
    const question = { id: id("qa"), pollId: poll.id, participantId: getParticipantId(), questionText, upvotes: 0, status: "active" as const, createdAt: new Date().toISOString() };
    poll.qnaQuestions = [question, ...(poll.qnaQuestions || [])];
    poll.updatedAt = new Date().toISOString();
    polls[index] = poll;
    writeLocalPolls(polls);
    return { poll, results: buildLocalResults(poll) };
  };

  if (isLocalOnlyMode()) return addLocal();
  try {
    return await apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/${encodeURIComponent(pollId)}/qa`, {
      method: "POST",
      body: JSON.stringify({ participantId: getParticipantId(), questionText }),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return addLocal();
  }
}

export async function upvoteQuestion(pollId: string, questionId: string) {
  const upvoteLocal = () => {
    const polls = readLocalPolls();
    const index = findLocalPollIndex(polls, pollId);
    if (index === -1) throw new Error("Poll not found.");
    const poll = polls[index];
    poll.qnaQuestions = (poll.qnaQuestions || []).map((question) =>
      question.id === questionId ? { ...question, upvotes: (question.upvotes || 0) + 1 } : question,
    );
    poll.updatedAt = new Date().toISOString();
    polls[index] = poll;
    writeLocalPolls(polls);
    return { poll, results: buildLocalResults(poll) };
  };

  if (isLocalOnlyMode()) return upvoteLocal();
  try {
    return await apiRequest<{ poll: Poll; results: PollResults }>(
      `/api/polls/${encodeURIComponent(pollId)}/qa/${encodeURIComponent(questionId)}/upvote`,
      {
        method: "PUT",
        body: JSON.stringify({ participantId: getParticipantId() }),
      },
    );
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return upvoteLocal();
  }
}

export async function submitQuizAnswer(
  pollId: string,
  payload: { questionId: string; selectedAnswer: string; participantName: string },
) {
  const submitLocal = () => {
    const polls = readLocalPolls();
    const index = findLocalPollIndex(polls, pollId);
    if (index === -1) throw new Error("Poll not found.");
    const poll = polls[index];
    const question = (poll.quizQuestions || []).find((item) => item.id === payload.questionId);
    const isCorrect = normalize(payload.selectedAnswer) === normalize(question?.correctAnswer || "");
    poll.quizSubmissions = [
      {
        id: id("quizsub"),
        participantId: getParticipantId(),
        participantName: payload.participantName,
        quizPollId: poll.id,
        questionId: payload.questionId,
        selectedAnswer: payload.selectedAnswer,
        isCorrect,
        score: isCorrect ? Number(question?.points || 10) : 0,
        createdAt: new Date().toISOString(),
      },
      ...(poll.quizSubmissions || []),
    ];
    poll.updatedAt = new Date().toISOString();
    polls[index] = poll;
    writeLocalPolls(polls);
    return { poll, results: buildLocalResults(poll) };
  };

  if (isLocalOnlyMode()) return submitLocal();
  try {
    return await apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/${encodeURIComponent(pollId)}/quiz/submit`, {
      method: "POST",
      body: JSON.stringify({ participantId: getParticipantId(), ...payload }),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return submitLocal();
  }
}

export async function updatePollStatus(pollId: string, status: PollStatus) {
  const updateLocal = () => {
    const polls = readLocalPolls();
    const index = findLocalPollIndex(polls, pollId);
    if (index === -1) throw new Error("Poll not found.");
    const poll = { ...polls[index], status, updatedAt: new Date().toISOString() };
    polls[index] = poll;
    writeLocalPolls(polls);
    return { poll, results: buildLocalResults(poll) };
  };

  if (isLocalOnlyMode()) return updateLocal();
  try {
    return await apiRequest<{ poll: Poll; results: PollResults }>(`/api/polls/${encodeURIComponent(pollId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return updateLocal();
  }
}

export async function deletePoll(pollId: string) {
  const deleteLocal = () => {
    writeLocalPolls(readLocalPolls().filter((poll) => poll.id !== pollId));
    return { ok: true };
  };

  if (isLocalOnlyMode()) return deleteLocal();
  try {
    return await apiRequest<{ ok: boolean }>(`/api/polls/${encodeURIComponent(pollId)}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (!shouldUseLocalFallback(error)) throw error;
    return deleteLocal();
  }
}

export function csvExportUrl(pollId: string) {
  return `${API_URL}/api/polls/${encodeURIComponent(pollId)}/export/csv`;
}

export function participantUrl(code: string) {
  return `${window.location.origin}/p/${encodeURIComponent(code)}`;
}
