import { z } from 'zod';
import { NotificationChannel } from '@prisma/client';

const channelValues = Object.values(NotificationChannel) as [NotificationChannel, ...NotificationChannel[]];

export const listNotificationsQuerySchema = z.object({
  channel: z.string().optional(),
  status: z.string().optional(),
  unread_only: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  cursor: z.string().optional()
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export const updatePreferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  inappEnabled: z.boolean().optional(),
  language: z.enum(['en', 'am']).optional()
});
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

export const broadcastSchema = z.object({
  templateCode: z.string().min(1),
  variables: z.record(z.union([z.string(), z.number()])),
  recipients: z.object({
    userIds: z.array(z.string().uuid()).optional(),
    beneficiaryIds: z.array(z.string().uuid()).optional()
  }),
  channels: z.array(z.enum(channelValues)).optional()
});
export type BroadcastInput = z.infer<typeof broadcastSchema>;