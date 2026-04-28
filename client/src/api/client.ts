const BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data as T;
}

export const api = {
  auth: {
    register: (username: string, password: string) =>
      request<{ token: string; username: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    login: (username: string, password: string) =>
      request<{ token: string; username: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },
  tasks: {
    list: () => request<import('../types').Task[]>('/tasks'),
    create: (name: string, color: string) =>
      request<import('../types').Task>('/tasks', { method: 'POST', body: JSON.stringify({ name, color }) }),
    update: (id: number, patch: Partial<{ name: string; color: string; status: string }>) =>
      request<import('../types').Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
    delete: (id: number) => request<{ ok: boolean }>(`/tasks/${id}`, { method: 'DELETE' }),
  },
  timer: {
    start: (taskId: number) => request<{ entryId: number }>('/timer/start', { method: 'POST', body: JSON.stringify({ taskId }) }),
    stop: (taskId?: number) => request<{ ok: boolean }>('/timer/stop', { method: 'POST', body: JSON.stringify({ taskId }) }),
    active: () => request<import('../types').ActiveEntry[]>('/timer/active'),
  },
  stats: {
    get: (from: number, to: number) =>
      request<import('../types').StatsResponse>(`/stats?from=${from}&to=${to}`),
  },
};
