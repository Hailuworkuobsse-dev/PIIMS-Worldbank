import { prisma } from '@/lib/prisma.js';
import { logger } from '@/config/logger.js';
import { NotFoundError } from '@/lib/errors.js';
import { smsAdapter } from '@/modules/integrations/adapters/sms.adapter.js';

/**
 * SMS channel — sends via the SMS gateway integration adapter.
 */
export async function deliverSms(notificationId: string): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { notificationId },
    include: { user: { select: { phone: true, fullName: true } } }
  });
  if (!notification) throw new NotFoundError('Notification', notificationId);

  // Resolve phone: either from user or from beneficiary
  let phone: string | null = notification.user?.phone ?? null;

  if (!phone && notification.beneficiaryId) {
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { beneficiaryId: notification.beneficiaryId },
      select: { phone: true }
    });
    phone = beneficiary?.phone ?? null;
  }

  if (!phone) {
    await prisma.notification.update({
      where: { notificationId },
      data: { status: 'FAILED', error: 'No recipient phone number' }
    });
    return;
  }

  try {
    await smsAdapter.send({
      msisdn: phone,
      message: notification.body,
      reference: notificationId
    });

    await prisma.notification.update({
      where: { notificationId },
      data: { status: 'SENT', sentAt: new Date() }
    });

    logger.info({ notificationId, to: phone }, 'SMS dispatched');
  } catch (err) {
    const message = (err as Error).message;
    await prisma.notification.update({
      where: { notificationId },
      data: { status: 'FAILED', error: message.slice(0, 500) }
    });
    logger.error({ notificationId, err: message }, 'SMS delivery failed');
    throw err;
  }
}