import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma.js';
import { getQueue, QUEUE_NAMES } from '@/config/queue.js';
import { logger } from '@/config/logger.js';
import { parsePagination } from '@/utils/pagination.js';
import { NotFoundError, BadRequestError } from '@/lib/errors.js';
import { TEMPLATE_BY_CODE, renderTemplate, localizedTemplate } from './notification.templates.js';
import type {
  NotifyOptions, TemplateCode, NotificationDTO, NotificationPreferenceDTO
} from './notification.types.js';
import type {
  ListNotificationsQuery, UpdatePreferencesInput, BroadcastInput
} from './notification.schemas.js';

/* ════════════════════════════════════════════════════════════════════
 * NOTIFY — main entry point for domain events
 * ════════════════════════════════════════════════════════════════════ */

export async function notify(options: NotifyOptions): Promise<{ created: number }> {
  const template = TEMPLATE_BY_CODE[options.templateCode as TemplateCode];
  if (!template) {
    logger.warn({ code: options.templateCode }, 'unknown template code');
    throw new BadRequestError(`Unknown template: ${options.templateCode}`);
  }

  const channels = options.channels ?? template.channels;
  const language = options.language ?? 'en';

  // Find the templateId in DB (may be null if not seeded)
  const templateRecord = await prisma.notificationTemplate.findUnique({
    where: { code: template.code }
  });

  const { subject, body } = localizedTemplate(template, language);
  const renderedSubject = renderTemplate(subject, options.variables);
  const renderedBody = renderTemplate(body, options.variables);

  let created = 0;

  // Notify users
  for (const userId of options.recipients.userIds ?? []) {
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { userId: true, locale: true }
    });
    if (!user) continue;

    const userLanguage = language === 'am' || user.locale === 'am' ? 'am' : 'en';
    const localRendered = localizedTemplate(template, userLanguage);

    for (const channel of channels) {
      const notification = await prisma.notification.create({
        data: {
          userId,
          channel,
          ...(templateRecord ? { templateId: templateRecord.templateId } : {}),
          ...(renderedSubject ? { subject: renderTemplate(localRendered.subject, options.variables) } : {}),
          body: renderTemplate(localRendered.body, options.variables),
          language: userLanguage,
          status: channel === 'IN_APP' ? 'PENDING' : 'PENDING'
        }
      });

      await enqueueDelivery(notification.notificationId, channel);
      created++;
    }
  }

  // Notify beneficiaries
  for (const beneficiaryId of options.recipients.beneficiaryIds ?? []) {
    const beneficiary = await prisma.beneficiary.findUnique({
      where: { beneficiaryId },
      select: { beneficiaryId: true }
    });
    if (!beneficiary) continue;

    for (const channel of channels) {
      const notification = await prisma.notification.create({
        data: {
          beneficiaryId,
          channel,
          ...(templateRecord ? { templateId: templateRecord.templateId } : {}),
          body: renderedBody,
          language,
          status: 'PENDING'
        }
      });

      await enqueueDelivery(notification.notificationId, channel);
      created++;
    }
  }

  logger.info({ templateCode: template.code, created, channels }, 'notifications dispatched');
  return { created };
}

async function enqueueDelivery(notificationId: string, channel: string): Promise<void> {
  const queue = getQueue(QUEUE_NAMES.NOTIFY);
  await queue.add(
    channel,
    { notificationId, channel },
    {
      jobId: `notify:${notificationId}`,
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 }
    }
  );
}

/* ════════════════════════════════════════════════════════════════════
 * LIST + READ
 * ════════════════════════════════════════════════════════════════════ */

export async function listMyNotifications(
  userId: string,
  query: ListNotificationsQuery
): Promise<{
  data: NotificationDTO[];
  pagination: { limit: number; totalCount: number; hasMore: boolean };
  unreadCount: number;
}> {
  const pagination = parsePagination(query as Record<string, unknown>);

  const filters: Prisma.NotificationWhereInput[] = [{ userId }];
  if (query.channel) {
    const channels = query.channel.split(',').filter(Boolean);
    if (channels.length) filters.push({ channel: { in: channels as any[] } });
  }
  if (query.status) {
    const statuses = query.status.split(',').filter(Boolean);
    if (statuses.length) filters.push({ status: { in: statuses as any[] } });
  }
  if (query.unread_only) {
    filters.push({ readAt: null });
  }

  const where: Prisma.NotificationWhereInput = { AND: filters };

  const [rows, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: pagination.limit
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } })
  ]);

  return {
    data: rows.map(toNotificationDTO),
    pagination: { limit: pagination.limit, totalCount, hasMore: totalCount > rows.length },
    unreadCount
  };
}

export async function markAsRead(notificationId: string, userId: string): Promise<void> {
  const notification = await prisma.notification.findFirst({
    where: { notificationId, userId }
  });
  if (!notification) throw new NotFoundError('Notification', notificationId);

  await prisma.notification.update({
    where: { notificationId },
    data: { readAt: new Date(), status: 'READ' }
  });
}

export async function markAllAsRead(userId: string): Promise<{ updated: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date(), status: 'READ' }
  });
  return { updated: result.count };
}

export async function deleteNotification(notificationId: string, userId: string): Promise<void> {
  const notification = await prisma.notification.findFirst({
    where: { notificationId, userId }
  });
  if (!notification) throw new NotFoundError('Notification', notificationId);

  await prisma.notification.delete({ where: { notificationId } });
}

/* ════════════════════════════════════════════════════════════════════
 * PREFERENCES — stored in SystemSetting for MVP
 * ════════════════════════════════════════════════════════════════════ */

const PREFS_KEY = (userId: string) => `notification:pref:${userId}`;

export async function getPreferences(userId: string): Promise<NotificationPreferenceDTO> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: PREFS_KEY(userId) } });
  const value = (setting?.value as Record<string, unknown>) ?? {};

  return {
    userId,
    emailEnabled: value.emailEnabled !== false,
    smsEnabled: value.smsEnabled !== false,
    inappEnabled: value.inappEnabled !== false,
    language: (value.language as 'en' | 'am') ?? 'en'
  };
}

export async function updatePreferences(
  userId: string,
  input: UpdatePreferencesInput
): Promise<NotificationPreferenceDTO> {
  const current = await getPreferences(userId);
  const next = {
    emailEnabled: input.emailEnabled ?? current.emailEnabled,
    smsEnabled: input.smsEnabled ?? current.smsEnabled,
    inappEnabled: input.inappEnabled ?? current.inappEnabled,
    language: input.language ?? current.language
  };

  await prisma.systemSetting.upsert({
    where: { key: PREFS_KEY(userId) },
    create: {
      key: PREFS_KEY(userId),
      value: next as unknown as Prisma.InputJsonValue,
      category: 'notification'
    },
    update: { value: next as unknown as Prisma.InputJsonValue }
  });

  return { userId, ...next };
}

/* ════════════════════════════════════════════════════════════════════
 * BROADCAST
 * ════════════════════════════════════════════════════════════════════ */

export async function broadcast(input: BroadcastInput): Promise<{ created: number }> {
  return notify({
    recipients: {
      ...(input.recipients.userIds ? { userIds: input.recipients.userIds } : {}),
      ...(input.recipients.beneficiaryIds ? { beneficiaryIds: input.recipients.beneficiaryIds } : {})
    },
    templateCode: input.templateCode as TemplateCode,
    variables: input.variables,
    ...(input.channels ? { channels: input.channels } : {})
  });
}

/* ════════════════════════════════════════════════════════════════════
 * MAPPERS
 * ════════════════════════════════════════════════════════════════════ */

function toNotificationDTO(n: any): NotificationDTO {
  return {
    notificationId: n.notificationId,
    channel: n.channel,
    status: n.status,
    ...(n.subject ? { subject: n.subject } : {}),
    body: n.body,
    language: n.language,
    createdAt: n.createdAt.toISOString(),
    ...(n.sentAt ? { sentAt: n.sentAt.toISOString() } : {}),
    ...(n.deliveredAt ? { deliveredAt: n.deliveredAt.toISOString() } : {}),
    ...(n.readAt ? { readAt: n.readAt.toISOString() } : {})
  };
}