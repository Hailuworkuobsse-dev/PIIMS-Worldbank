import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '@/lib/errors.js';
import { sendSuccess, sendNoContent } from '@/lib/response.js';
import * as service from './notification.service.js';
import type { ListNotificationsQuery, UpdatePreferencesInput, BroadcastInput } from './notification.schemas.js';

function getUser(req: Request) {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

export async function listHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const query = (res.locals.query ?? req.query) as ListNotificationsQuery;
    const result = await service.listMyNotifications(user.userId, query);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}

export async function unreadCountHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    const result = await service.listMyNotifications(user.userId, { unread_only: true, limit: 1 });
    sendSuccess(res, { count: result.unreadCount });
  } catch (err) { next(err); }
}

export async function markReadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    await service.markAsRead(req.params.id!, user.userId);
    sendNoContent(res);
  } catch (err) { next(err); }
}

export async function markAllReadHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.markAllAsRead(user.userId));
  } catch (err) { next(err); }
}

export async function deleteHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    await service.deleteNotification(req.params.id!, user.userId);
    sendNoContent(res);
  } catch (err) { next(err); }
}

export async function getPrefsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.getPreferences(user.userId));
  } catch (err) { next(err); }
}

export async function updatePrefsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getUser(req);
    sendSuccess(res, await service.updatePreferences(user.userId, req.body as UpdatePreferencesInput));
  } catch (err) { next(err); }
}

export async function broadcastHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    sendSuccess(res, await service.broadcast(req.body as BroadcastInput), 202);
  } catch (err) { next(err); }
}