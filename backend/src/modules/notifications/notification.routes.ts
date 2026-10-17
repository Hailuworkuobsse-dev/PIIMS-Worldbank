import { Router } from 'express';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requirePermission } from '@/middleware/requirePermission.js';
import { validate } from '@/middleware/validate.js';
import { listNotificationsQuerySchema, updatePreferencesSchema, broadcastSchema } from './notification.schemas.js';
import {
  listHandler, unreadCountHandler, markReadHandler, markAllReadHandler,
  deleteHandler, getPrefsHandler, updatePrefsHandler, broadcastHandler
} from './notification.controller.js';

export const notificationsRouter: Router = Router();
notificationsRouter.use(requireAuth);

notificationsRouter.get('/', validate({ query: listNotificationsQuerySchema }), listHandler);
notificationsRouter.get('/unread-count', unreadCountHandler);
notificationsRouter.post('/mark-all-read', markAllReadHandler);
notificationsRouter.post('/:id/read', markReadHandler);
notificationsRouter.delete('/:id', deleteHandler);
notificationsRouter.get('/preferences', getPrefsHandler);
notificationsRouter.put('/preferences', validate({ body: updatePreferencesSchema }), updatePrefsHandler);
notificationsRouter.post('/broadcast', requirePermission('notification:broadcast'),
  validate({ body: broadcastSchema }), broadcastHandler);