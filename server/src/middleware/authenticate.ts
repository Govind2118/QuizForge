import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { auth } from '../config/firebase.js';
import { ApiError } from '../utils/http.js';

export interface AuthenticatedRequest extends Request {
  user: DecodedIdToken;
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : undefined;

    if (!token) throw new ApiError(401, 'Missing authentication token.', 'UNAUTHENTICATED');

    const decoded = await auth.verifyIdToken(token);
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(401, 'Invalid or expired authentication token.', 'UNAUTHENTICATED'));
  }
}
