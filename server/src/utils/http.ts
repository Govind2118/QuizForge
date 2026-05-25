import type { NextFunction, Request, Response } from 'express';
import type { RequestWithContext } from '../middleware/requestContext.js';
import { ZodError } from 'zod';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public code = 'API_ERROR') {
    super(message);
  }
}

export function asyncHandler<T extends Request>(handler: (req: T, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: T, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, 'Route not found.', 'NOT_FOUND'));
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  void _next;
  const requestId = (req as RequestWithContext).requestId;
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.issues.map((issue) => issue.message).join('\n'),
        details: error.flatten(),
        requestId,
      },
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({ error: { code: error.code, message: error.message, requestId } });
  }

  console.error({ requestId, error });
  return res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong.', requestId } });
}
