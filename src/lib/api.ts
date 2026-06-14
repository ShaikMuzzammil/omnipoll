const BASE = import.meta.env.VITE_API_BASE ?? '/api';

function getToken() {
  return localStorage.getItem('op_token');
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown,
  signal?: AbortSignal
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? json.message ?? `HTTP ${res.status}`);
  return json as T;
}

const get    = <T>(p: string, s?: AbortSignal) => req<T>('GET',    p, undefined, s);
const post   = <T>(p: string, b?: unknown)     => req<T>('POST',   p, b);
const put    = <T>(p: string, b?: unknown)     => req<T>('PUT',    p, b);
const patch  = <T>(p: string, b?: unknown)     => req<T>('PATCH',  p, b);
const del    = <T>(p: string)                  => req<T>('DELETE', p);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  signup:  (data: { name:string; email:string; password:string; role?:string }) => post('/auth/signup', data),
  signin:  (data: { email:string; password:string }) => post<{token:string; user:unknown}>('/auth/signin', data),
  me:      () => get('/auth/me'),
  logout:  () => post('/auth/logout'),
  update:  (data: unknown) => put('/auth/me', data),
};

// ── Polls ─────────────────────────────────────────────────────────────────────
export const pollsApi = {
  list:    (params?: string) => get(`/polls${params ? '?' + params : ''}`),
  get:     (id: string)   => get(`/polls/${id}`),
  byCode:  (code: string) => get(`/polls/code/${code}`),
  create:  (data: unknown) => post('/polls', data),
  update:  (id: string, data: unknown) => put(`/polls/${id}`, data),
  delete:  (id: string)   => del(`/polls/${id}`),
  status:  (id: string, status: string) => patch(`/polls/${id}/status`, { status }),
  release: (id: string)   => post(`/polls/${id}/release`),
  duplicate:(id: string)  => post(`/polls/${id}/duplicate`),
  results: (id: string)   => get(`/polls/${id}/results`),
  analytics:(id: string)  => get(`/polls/${id}/analytics`),
  qr:      (id: string)   => get(`/polls/${id}/qr`),
};

// ── Attempts ──────────────────────────────────────────────────────────────────
export const attemptsApi = {
  start:   (pollId: string, meta?: unknown) => post(`/polls/${pollId}/attempts/start`, meta),
  save:    (attemptId: string, data: unknown) => patch(`/attempts/${attemptId}/save`, data),
  submit:  (attemptId: string, data: unknown) => post(`/attempts/${attemptId}/submit`, data),
  get:     (attemptId: string) => get(`/attempts/${attemptId}`),
  mine:    () => get('/attempts/mine'),
  forPoll: (pollId: string) => get(`/polls/${pollId}/attempts`),
  keySheet:(attemptId: string) => get(`/attempts/${attemptId}/keysheet`),
};

// ── Voting (non-quiz polls) ────────────────────────────────────────────────────
export const voteApi = {
  cast:    (pollId: string, data: unknown) => post(`/polls/${pollId}/vote`, data),
};

// ── Classrooms ────────────────────────────────────────────────────────────────
export const classroomsApi = {
  list:    () => get('/classrooms'),
  get:     (id: string) => get(`/classrooms/${id}`),
  create:  (data: unknown) => post('/classrooms', data),
  update:  (id: string, data: unknown) => put(`/classrooms/${id}`, data),
  delete:  (id: string) => del(`/classrooms/${id}`),
  join:    (code: string) => post('/classrooms/join', { code }),
  leave:   (id: string) => post(`/classrooms/${id}/leave`),
  students:(id: string) => get(`/classrooms/${id}/students`),
  remove:  (id: string, userId: string) => del(`/classrooms/${id}/students/${userId}`),
  polls:   (id: string) => get(`/classrooms/${id}/polls`),
  results: (id: string) => get(`/classrooms/${id}/results`),
};

// ── Q&A ───────────────────────────────────────────────────────────────────────
export const qaApi = {
  list:     (pollId: string) => get(`/polls/${pollId}/qa`),
  submit:   (pollId: string, data: unknown) => post(`/polls/${pollId}/qa`, data),
  upvote:   (qaId: string) => post(`/qa/${qaId}/upvote`),
  answer:   (qaId: string, text: string) => post(`/qa/${qaId}/answer`, { text }),
  moderate: (qaId: string, action: string) => patch(`/qa/${qaId}/moderate`, { action }),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifApi = {
  list:    () => get('/notifications'),
  unread:  () => get('/notifications/unread-count'),
  markRead:(id: string) => patch(`/notifications/${id}/read`, {}),
  markAll: () => patch('/notifications/read-all', {}),
  delete:  (id: string) => del(`/notifications/${id}`),
};

// ── Templates ─────────────────────────────────────────────────────────────────
export const templatesApi = {
  list:   () => get('/templates'),
  get:    (id: string) => get(`/templates/${id}`),
  save:   (pollId: string) => post('/templates', { pollId }),
  delete: (id: string) => del(`/templates/${id}`),
};

// ── Analytics (global) ────────────────────────────────────────────────────────
export const analyticsApi = {
  overview:  () => get('/analytics/overview'),
  classroom: (id: string) => get(`/analytics/classroom/${id}`),
  student:   (userId: string) => get(`/analytics/student/${userId}`),
  export:    (pollId: string, fmt: string) => get(`/analytics/${pollId}/export?format=${fmt}`),
};
