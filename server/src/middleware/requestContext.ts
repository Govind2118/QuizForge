import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export interface RequestWithContext extends Request {
  requestId: string;
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const headerRequestId = req.header('x-request-id')?.trim();
  const requestId = headerRequestId && headerRequestId.length <= 120 ? headerRequestId : randomUUID();
  (req as RequestWithContext).requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}
