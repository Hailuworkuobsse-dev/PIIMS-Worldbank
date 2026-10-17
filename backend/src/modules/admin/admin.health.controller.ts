import type { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '@/lib/response.js';
import * as service from './admin.health.service.js';

export async function healthHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const health = await service.getSystemHealth();
    sendSuccess(res, health);
  } catch (err) {
    next(err);
  }
}