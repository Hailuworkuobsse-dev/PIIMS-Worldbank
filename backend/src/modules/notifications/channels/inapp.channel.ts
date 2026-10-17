import { prisma } from '@/lib/prisma.js';
import { logger } from '@/config/logger.js';
import { NotFoundError } from '@/lib/errors.js';

/**
 * In-app channel — delivers notifications that appear inside the PIIMS web app.
 * Delivery is instantaneous (just mark the DB row as DELIVERED).
 */
export async function deliverInApp(notificationId: string): Promise<void> {
  const notification = await prisma.notification.findUnique({ where: { notificationId } });
  if (!notification) throw new NotFoundError('Notification', notificationId);

  await prisma.notification.update({
    where: { notificationId },
    data: {
      status: 'DELIVERED',
      sentAt: new Date(),
      deliveredAt: new Date()
    }
  });

  logger.debug({ notificationId }, 'in-app notification delivered');
}