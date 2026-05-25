import { auth } from '../config/firebase.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';

interface FirebaseAuthRestResponse {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  email: string;
  displayName?: string;
}

interface AuthSessionResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

function mapFirebaseAuthError(message: string): ApiError {
  if (message.includes('EMAIL_EXISTS')) {
    return new ApiError(409, 'An account with this email already exists.', 'EMAIL_EXISTS');
  }

  if (message.includes('EMAIL_NOT_FOUND') || message.includes('INVALID_PASSWORD') || message.includes('INVALID_LOGIN_CREDENTIALS')) {
    return new ApiError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
  }

  if (message.includes('WEAK_PASSWORD')) {
    return new ApiError(400, 'Password is too weak.', 'WEAK_PASSWORD');
  }

  if (message.includes('OPERATION_NOT_ALLOWED') || message.includes('EMAIL_PASSWORD_SIGN_IN_DISABLED')) {
    return new ApiError(
      400,
      'Email/password authentication is not enabled in Firebase. Enable it in Firebase Console → Authentication → Sign-in method.',
      'EMAIL_PASSWORD_DISABLED',
    );
  }

  if (message.includes('INVALID_API_KEY') || message.includes('API key not valid')) {
    return new ApiError(400, 'The Firebase Web API key is invalid. Check FIREBASE_WEB_API_KEY in server/.env.', 'INVALID_FIREBASE_WEB_API_KEY');
  }

  return new ApiError(400, 'Authentication failed.', 'AUTH_FAILED');
}

async function callFirebaseAuth(action: 'signUp' | 'signInWithPassword', body: Record<string, unknown>): Promise<FirebaseAuthRestResponse> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${env.FIREBASE_WEB_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, returnSecureToken: true }),
  });

  const payload = (await response.json()) as FirebaseAuthRestResponse & { error?: { message?: string } };
  if (!response.ok) {
    const message = payload.error?.message ?? 'Authentication failed.';
    if (env.NODE_ENV !== 'production') console.error('[Firebase Auth REST error]', { action, status: response.status, message });
    throw mapFirebaseAuthError(message);
  }

  return payload;
}

function toSession(payload: FirebaseAuthRestResponse): AuthSessionResponse {
  return {
    token: payload.idToken,
    refreshToken: payload.refreshToken,
    expiresIn: Number(payload.expiresIn),
    user: {
      id: payload.localId,
      email: payload.email,
      name: payload.displayName || undefined,
    },
  };
}

export async function registerWithEmail(email: string, password: string, name?: string): Promise<AuthSessionResponse> {
  const payload = await callFirebaseAuth('signUp', { email, password });
  if (name) {
    await auth.updateUser(payload.localId, { displayName: name });
    payload.displayName = name;
  }
  return toSession(payload);
}

export async function loginWithEmail(email: string, password: string): Promise<AuthSessionResponse> {
  const payload = await callFirebaseAuth('signInWithPassword', { email, password });
  return toSession(payload);
}

export async function getUserSessionFromToken(uid: string): Promise<AuthSessionResponse['user']> {
  const user = await auth.getUser(uid);
  return {
    id: user.uid,
    email: user.email ?? '',
    name: user.displayName || undefined,
  };
}
