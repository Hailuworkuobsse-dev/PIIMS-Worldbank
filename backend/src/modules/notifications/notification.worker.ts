import { QUEUE_NAMES, registerWorker } from '@/config/queue.js';
import { logger } from '@/config/logger.js';
import { deliverInApp } from './channels/inapp.channel.js';
import { deliverEmail } from './channels/email.channel.js';
import { deliverSms } from './channels/sms.channel.js';

type JobPayload = { notificationId: string; channel: 'IN_APP' | 'EMAIL' | 'SMS' };

export function startNotificationWorker(): ReturnType<typeof registerWorker> {
  const worker = registerWorker<JobPayload>(
    QUEUE_NAMES.NOTIFY,
    async (job) => {
      const { notificationId, channel } = job.data;
      logger.debug({ notificationId, channel }, 'notification job started');

      switch (channel) {
        case 'IN_APP':
          await deliverInApp(notificationId);
          break;
        case 'EMAIL':
          await deliverEmail(notificationId);
          break;
        case 'SMS':
          await deliverSms(notificationId);
          break;
        default:
          logger.warn({ channel }, 'unknown notification channel');
      }

      return { notificationId, ok: true };
    },
    5 // higher concurrency for notifications
  );

  logger.info('notification worker registered');
  return worker;
}