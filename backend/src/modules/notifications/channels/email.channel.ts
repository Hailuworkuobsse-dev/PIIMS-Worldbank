import nodemailer, { type Transporter } from 'nodemailer';
import { prisma } from '@/lib/prisma.js';
import { logger } from '@/config/logger.js';
import { NotFoundError } from '@/lib/errors.js';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';
  const from = process.env.SMTP_FROM ?? 'noreply@piims.gov.et';

  if (!host || !user || !pass) {
    // Fall back to a null transport (logs to console) for dev without SMTP
    logger.warn('SMTP not configured — using console transport');
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,
    maxConnections: 5
  });

  logger.info({ host, port, from }, 'SMTP transport configured');
  return transporter;
}

export async function deliverEmail(notificationId: string): Promise<void> {
  const notification = await prisma.notification.findUnique({
    where: { notificationId },
    include: { user: { select: { email: true, fullName: true } }, template: true }
  });
  if (!notification) throw new NotFoundError('Notification', notificationId);

  const recipientEmail = notification.user?.email;
  if (!recipientEmail) {
    await prisma.notification.update({
      where: { notificationId },
      data: { status: 'FAILED', error: 'No recipient email' }
    });
    return;
  }

  const from = process.env.SMTP_FROM ?? 'noreply@piims.gov.et';

  try {
    await getTransporter().sendMail({
      from,
      to: recipientEmail,
      subject: notification.subject ?? 'PIIMS Notification',
      text: notification.body,
      headers: {
        'X-PIIMS-Notification-Id': notificationId
      }
    });

    await prisma.notification.update({
      where: { notificationId },
      data: { status: 'DELIVERED', sentAt: new Date(), deliveredAt: new Date() }
    });

    logger.info({ notificationId, to: recipientEmail }, 'email sent');
  } catch (err) {
    const message = (err as Error).message;
    await prisma.notification.update({
      where: { notificationId },
      data: { status: 'FAILED', error: message.slice(0, 500) }
    });
    logger.error({ notificationId, err: message }, 'email delivery failed');
    throw err;
  }
}