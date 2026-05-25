import type { AuthSession } from '@/types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
const SESSION_KEY = 'quizforge.session';

interface ApiErrorPayload {
  error?: {
    message?: string;
    code?: string;
    requestId?: string;
  };
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public requestId?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export function readSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function writeSession(session: AuthSession | null) {
  if (!session) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, useAuth = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (useAuth) {
    const session = readSession();
    if (session?.token) headers.set('Authorization', `Bearer ${session.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => undefined) as ApiErrorPayload | T | undefined;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | undefined;
    const message = errorPayload?.error?.message ?? 'Request failed.';
    const requestId = errorPayload?.error?.requestId ?? response.headers.get('X-Request-Id') ?? undefined;
    throw new ApiClientError(message, response.status, errorPayload?.error?.code, requestId);
  }

  return payload as T;
}
