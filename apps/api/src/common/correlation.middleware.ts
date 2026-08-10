import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export function correlationMiddleware(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header('x-correlation-id');
  const correlationId = incoming && incoming.length > 0 ? incoming : randomUUID();
  (req as Request & { correlationId: string }).correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}
