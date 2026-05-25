import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../utils/http.js';

process.env.NODE_ENV = 'test';
process.env.FIREBASE_WEB_API_KEY = 'test-api-key';

const updateUser = vi.fn();
const getUser = vi.fn();

vi.mock('../config/firebase.js', () => ({
  auth: {
    updateUser,
    getUser,
  },
}));

const { getUserSessionFromToken, loginWithEmail, registerWithEmail } = await import('./authService.js');

const authPayload = {
  idToken: 'id-token',
  refreshToken: 'refresh-token',
  expiresIn: '3600',
  localId: 'firebase-uid',
  email: 'user@example.com',
};

function mockFetchResponse(ok: boolean, payload: unknown, status = ok ? 200 : 400) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response);
}

describe('authService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    updateUser.mockReset();
    getUser.mockReset();
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers with Firebase Auth REST and stores a display name when provided', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(true, { ...authPayload }));
    updateUser.mockResolvedValue(undefined);

    const session = await registerWithEmail('user@example.com', 'password123', 'Jane');

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('accounts:signUp?key=test-api-key'), expect.objectContaining({ method: 'POST' }));
    expect(updateUser).toHaveBeenCalledWith('firebase-uid', { displayName: 'Jane' });
    expect(session).toEqual({
      token: 'id-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      user: { id: 'firebase-uid', email: 'user@example.com', name: 'Jane' },
    });
  });

  it('logs in with Firebase Auth REST', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(true, { ...authPayload, displayName: 'Jane' }));

    const session = await loginWithEmail('user@example.com', 'password123');

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('accounts:signInWithPassword?key=test-api-key'), expect.any(Object));
    expect(session.user).toEqual({ id: 'firebase-uid', email: 'user@example.com', name: 'Jane' });
  });

  it.each([
    ['EMAIL_EXISTS', 409, 'EMAIL_EXISTS'],
    ['INVALID_LOGIN_CREDENTIALS', 401, 'INVALID_CREDENTIALS'],
    ['WEAK_PASSWORD : Password should be at least 6 characters', 400, 'WEAK_PASSWORD'],
    ['OPERATION_NOT_ALLOWED', 400, 'EMAIL_PASSWORD_DISABLED'],
    ['API key not valid. Please pass a valid API key.', 400, 'INVALID_FIREBASE_WEB_API_KEY'],
  ])('maps Firebase Auth REST error %s', async (message, statusCode, code) => {
    vi.stubGlobal('fetch', mockFetchResponse(false, { error: { message } }));

    await expect(loginWithEmail('user@example.com', 'password123')).rejects.toMatchObject({
      statusCode,
      code,
    });
  });

  it('returns a user session from a verified token uid', async () => {
    getUser.mockResolvedValue({ uid: 'uid-1', email: 'person@example.com', displayName: 'Person' });

    await expect(getUserSessionFromToken('uid-1')).resolves.toEqual({
      id: 'uid-1',
      email: 'person@example.com',
      name: 'Person',
    });
  });

  it('uses a safe fallback message for unknown Firebase Auth REST errors', async () => {
    vi.stubGlobal('fetch', mockFetchResponse(false, { error: { message: 'SOMETHING_NEW' } }));

    const result = registerWithEmail('user@example.com', 'password123');
    await expect(result).rejects.toBeInstanceOf(ApiError);
    await expect(result).rejects.toMatchObject({ code: 'AUTH_FAILED' });
  });
});
