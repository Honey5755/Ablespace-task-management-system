import type {
  Comment,
  CreateProjectInput,
  CreateTaskInput,
  Label,
  Project,
  Task,
  TaskDetail,
  TaskQuery,
  TaskStats,
  UpdateProfileInput,
  UpdateTaskInput,
  User,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const TOKEN_KEY = 'pyramid.token';

/** Carries the HTTP status so callers can branch on 401 vs 4xx vs 5xx. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const tokenStore = {
  get: (): string | null =>
    typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => window.localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => window.localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    // Nest returns { message: string | string[] }; flatten it for display.
    const body = await response.json().catch(() => null);
    const raw = body?.message ?? response.statusText;
    throw new ApiError(Array.isArray(raw) ? raw.join(', ') : String(raw), response.status);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

/** Repeats array params (`?status=todo&status=doing`) so Nest parses them as arrays. */
const toQueryString = (query: object): string => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      for (const item of value) params.append(key, String(item));
    } else {
      params.set(key, String(value));
    }
  }

  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
};

export const api = {
  loginAsGuest: (name?: string): Promise<{ accessToken: string; user: User }> =>
    request('/auth/guest', { method: 'POST', body: JSON.stringify(name ? { name } : {}) }),

  me: (): Promise<User> => request('/auth/me'),

  updateProfile: (input: UpdateProfileInput): Promise<User> =>
    request('/users/me', { method: 'PATCH', body: JSON.stringify(input) }),

  deleteAccount: (): Promise<void> => request('/users/me', { method: 'DELETE' }),

  listTasks: (query: TaskQuery = {}): Promise<Task[]> => request(`/tasks${toQueryString(query)}`),

  getTask: (id: string): Promise<TaskDetail> => request(`/tasks/${id}`),

  taskStats: (): Promise<TaskStats> => request('/tasks/stats'),

  createTask: (input: CreateTaskInput): Promise<Task> =>
    request('/tasks', { method: 'POST', body: JSON.stringify(input) }),

  updateTask: (id: string, input: UpdateTaskInput): Promise<Task> =>
    request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),

  deleteTask: (id: string): Promise<void> => request(`/tasks/${id}`, { method: 'DELETE' }),

  reorderTasks: (items: { id: string; status: Task['status'] }[]): Promise<Task[]> =>
    request('/tasks/reorder', { method: 'PATCH', body: JSON.stringify({ items }) }),

  addComment: (taskId: string, body: string): Promise<Comment> =>
    request(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ body }) }),

  deleteComment: (taskId: string, commentId: string): Promise<void> =>
    request(`/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }),

  listProjects: (search?: string): Promise<Project[]> =>
    request(`/projects${toQueryString({ search })}`),

  createProject: (input: CreateProjectInput): Promise<Project> =>
    request('/projects', { method: 'POST', body: JSON.stringify(input) }),

  updateProject: (id: string, input: Partial<CreateProjectInput>): Promise<Project> =>
    request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),

  deleteProject: (id: string): Promise<void> => request(`/projects/${id}`, { method: 'DELETE' }),

  listLabels: (): Promise<Label[]> => request('/labels'),
};
