import { z } from 'zod';
import { INTEGRATION_CODES } from './integration.types.js';

const integrationCodeValues = INTEGRATION_CODES as unknown as [string, ...string[]];

export const syncTriggerSchema = z.object({
  integrationCode: z.enum(integrationCodeValues),
  kind: z.string().optional()
});
export type SyncTriggerInput = z.infer<typeof syncTriggerSchema>;

export const runsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  status: z.string().optional()
});
export type RunsQuery = z.infer<typeof runsQuerySchema>;

export const inboundSmsSchema = z.object({
  msisdn: z.string().regex(/^\+?\d{9,15}$/, 'Valid phone required'),
  message: z.string().min(1).max(1000),
  received_at: z.string().datetime().optional(),
  gateway_message_id: z.string().optional()
});
export type InboundSmsInput = z.infer<typeof inboundSmsSchema>;

export const smsDeliveryReceiptSchema = z.object({
  gateway_message_id: z.string().min(1),
  status: z.enum(['DELIVERED', 'FAILED', 'PENDING']),
  delivered_at: z.string().datetime().optional()
});
export type SmsDeliveryReceiptInput = z.infer<typeof smsDeliveryReceiptSchema>;

export const ussdSessionSchema = z.object({
  session_id: z.string().min(1),
  msisdn: z.string().regex(/^\+?\d{9,15}$/),
  input: z.string().max(500),
  step: z.coerce.number().int().min(0).optional(),
  network_code: z.string().optional()
});
export type UssdSessionInput = z.infer<typeof ussdSessionSchema>;

export const odkWebhookSchema = z.object({
  form_id: z.string().min(1),
  instance_id: z.string().min(1),
  submission_id: z.string().optional(),
  submitted_at: z.string().datetime().optional(),
  data: z.record(z.unknown())
});
export type OdkWebhookInput = z.infer<typeof odkWebhookSchema>;

export const mobileMoneyCallbackSchema = z.object({
  reference: z.string().min(1),
  status: z.enum(['SUCCESS', 'FAILED', 'PENDING']),
  transaction_id: z.string().optional(),
  amount: z.string().optional(),
  completed_at: z.string().datetime().optional()
});
export type MobileMoneyCallbackInput = z.infer<typeof mobileMoneyCallbackSchema>;