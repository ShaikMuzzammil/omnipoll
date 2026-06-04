/// <reference types="../vite-env" />
import { useAuthStore } from "../store/authStore";

const BASE_URL = import.meta.env.VITE_API_URL || "";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const token = useAuthStore.getState().accessToken;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method,
      headers: this.getHeaders(),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (res.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data.data ?? data;
  }

  get = <T>(path: string) => this.request<T>("GET", path);
  post = <T>(path: string, body: unknown) => this.request<T>("POST", path, body);
  put = <T>(path: string, body: unknown) => this.request<T>("PUT", path, body);
  patch = <T>(path: string, body: unknown) => this.request<T>("PATCH", path, body);
  del = <T>(path: string) => this.request<T>("DELETE", path);
}

export const api = new ApiClient(BASE_URL);

// ── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) => api.post<{ user: import("../types").User; accessToken: string }>("/auth/login", { email, password }),
  signup: (name: string, email: string, password: string) => api.post<{ user: import("../types").User; accessToken: string }>("/auth/register", { name, email, password }),
  logout: () => api.post("/auth/logout", {}),
  me: () => api.get<import("../types").User>("/auth/me"),
};

// ── Polls ────────────────────────────────────────────────────
export const pollsApi = {
  list: () => api.get<{ polls: import("../types").Poll[] }>("/polls"),
  get: (id: string) => api.get<{ poll: import("../types").Poll; results: import("../types").PollResults }>(`/polls/${id}`),
  create: (data: unknown) => api.post<{ poll: import("../types").Poll }>("/polls", data),
  update: (id: string, data: unknown) => api.patch<{ poll: import("../types").Poll }>(`/polls/${id}`, data),
  delete: (id: string) => api.del(`/polls/${id}`),
  setStatus: (id: string, status: string) => api.patch<{ poll: import("../types").Poll; results: import("../types").PollResults }>(`/polls/${id}/status`, { status }),
  duplicate: (id: string) => api.post<{ poll: import("../types").Poll }>(`/polls/${id}/duplicate`, {}),
  join: (code: string, name?: string) => api.post<{ poll: import("../types").Poll; participantId: string }>("/polls/join", { code, name }),
  vote: (pollId: string, data: unknown) => api.post(`/polls/${pollId}/vote`, data),
  getByCode: (code: string) => api.get<{ poll: import("../types").Poll }>(`/polls/code/${code}`),
};

// ── Analytics ─────────────────────────────────────────────────
export const analyticsApi = {
  overview: () => api.get<import("../types").ApiResponse<unknown>>("/analytics/overview"),
  poll: (id: string, range?: string) => api.get(`/analytics/polls/${id}?range=${range || "7d"}`),
  trends: (range?: string) => api.get(`/analytics/trends?range=${range || "30d"}`),
};

// ── Q&A ──────────────────────────────────────────────────────
export const qaApi = {
  submit: (pollId: string, question: string, name?: string) => api.post(`/polls/${pollId}/qa`, { question, name }),
  upvote: (pollId: string, questionId: string) => api.post(`/polls/${pollId}/qa/${questionId}/upvote`, {}),
  moderate: (pollId: string, questionId: string, action: string) => api.patch(`/polls/${pollId}/qa/${questionId}`, { action }),
};

// ── Templates ─────────────────────────────────────────────────
export const templatesApi = {
  list: (domain?: string) => api.get(`/templates${domain ? `?domain=${domain}` : ""}`),
  get: (id: string) => api.get(`/templates/${id}`),
  use: (id: string) => api.post<{ poll: import("../types").Poll }>(`/templates/${id}/use`, {}),
};
