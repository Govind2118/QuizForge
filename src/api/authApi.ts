import type { AuthSession } from '@/types/auth';
import { apiRequest, readSession, writeSession } from './client';

export async function register(email: string, password: string, name?: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  }, false);
  writeSession(session);
  return session;
}

export async function login(email: string, password: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }, false);
  writeSession(session);
  return session;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest<void>('/auth/logout', { method: 'POST' });
  } finally {
    writeSession(null);
  }
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  const existing = readSession();
  if (!existing) return null;

  try {
    const result = await apiRequest<{ user: AuthSession['user'] }>('/auth/me');
    const session = { ...existing, user: result.user };
    writeSession(session);
    return session;
  } catch {
    writeSession(null);
    return null;
  }
}
