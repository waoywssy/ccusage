const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'todo_app_token';

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (response.status === 204) return null;

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

async function request(path, options = {}) {
  const token = options.token ?? getStoredToken();
  const headers = new Headers(options.headers || {});
  const hasBody = options.body !== undefined;

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      payload?.error || payload?.message || `Request failed with status ${response.status}`,
      response.status,
      payload,
    );
  }

  return payload;
}

function normalizeUser(data, fallback = {}) {
  const source = data?.user || data?.data?.user || data || {};

  return {
    id: source.id ?? source._id ?? fallback.id ?? null,
    name:
      source.name ??
      source.username ??
      fallback.name ??
      source.email?.split('@')[0] ??
      fallback.email?.split('@')[0] ??
      '',
    email: source.email ?? fallback.email ?? '',
  };
}

function normalizeAuthPayload(payload, fallback = {}) {
  const token =
    payload?.token ||
    payload?.accessToken ||
    payload?.data?.token ||
    payload?.data?.accessToken;

  if (!token) {
    throw new ApiError('Auth response did not include a token.', 500, payload);
  }

  return {
    token,
    user: normalizeUser(payload, fallback),
  };
}

function normalizeTodo(todo) {
  return {
    id: todo.id ?? todo._id,
    title: todo.title ?? todo.text ?? '',
    completed: Boolean(todo.completed ?? todo.done),
  };
}

function normalizeTodoList(payload) {
  const items =
    payload?.todos ||
    payload?.items ||
    payload?.data?.todos ||
    payload?.data?.items ||
    payload?.data ||
    payload;

  if (!Array.isArray(items)) return [];
  return items.map(normalizeTodo);
}

export const authApi = {
  async login(credentials) {
    const payload = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    return normalizeAuthPayload(payload, credentials);
  },

  async register(credentials) {
    const payload = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    return normalizeAuthPayload(payload, credentials);
  },

  async getMe(token) {
    const payload = await request('/auth/me', { token });
    return normalizeUser(payload);
  },
};

export const todoApi = {
  async list(token) {
    const payload = await request('/todos', { token });
    return normalizeTodoList(payload);
  },

  async create(input, token) {
    const payload = await request('/todos', {
      method: 'POST',
      token,
      body: JSON.stringify(input),
    });

    return normalizeTodo(payload?.todo || payload?.data?.todo || payload?.data || payload);
  },

  async update(id, input, token) {
    const payload = await request(`/todos/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(input),
    });

    if (!payload) {
      return { id, ...input };
    }

    return normalizeTodo(payload?.todo || payload?.data?.todo || payload?.data || payload);
  },

  async remove(id, token) {
    await request(`/todos/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  async bulkComplete(ids, completed, token) {
    await Promise.all(ids.map((id) => todoApi.update(id, { completed }, token)));
  },
};
