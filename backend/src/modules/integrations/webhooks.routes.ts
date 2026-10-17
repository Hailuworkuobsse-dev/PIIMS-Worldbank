import { Router } from 'express';
import { validate } from '@/middleware/validate.js';
import { logger } from '@/config/logger.js';
import { sendSuccess } from '@/lib/response.js';
import { prisma } from '@/lib/prisma.js';
import {
  inboundSmsSchema, smsDeliveryReceiptSchema, ussdSessionSchema,
  odkWebhookSchema, mobileMoneyCallbackSchema
} from './integration.schemas.js';

/**
 * Webhook endpoints for INBOUND traffic from external systems.
 * These do NOT require authentication — they use API keys / IP allowlists
 * enforced at the reverse proxy or per-webhook verification below.
 */
export const webhooksRouter: Router = Router();

/* ════════════════════════════════════════════════════════════════════
 * SMS INBOUND — receives replies and registrations from beneficiaries
 * ════════════════════════════════════════════════════════════════════ */

webhooksRouter.post('/channels/sms/inbound', validate({ body: inboundSmsSchema }), async (req, res, next) => {
  try {
    const { msisdn, message } = req.body as { msisdn: string; message: string };
    logger.info({ msisdn, length: message.length }, 'inbound SMS received');

    // Parse command prefix
    const parts = message.trim().split(/\s+/);
    const command = parts[0]?.toUpperCase() ?? '';

    let reply: string | null = null;
    let action = 'NONE';

    switch (command) {
      case 'REG':
        action = 'REGISTER';
        reply = 'Registration received. You will receive a confirmation SMS shortly.';
        break;
      case 'CONF':
        action = 'CONFIRM';
        reply = parts[1] ? `Confirmation received for ${parts[1]}.` : 'Please include your ID: CONF <your-id>';
        break;
      case 'GRV':
        action = 'GRIEVANCE';
        reply = 'Your grievance has been received. You will receive a ticket number shortly.';
        break;
      case 'STAT':
        action = 'STATUS';
        reply = 'Status check received.';
        break;
      case 'STOP':
        action = 'OPT_OUT';
        reply = 'You have been unsubscribed.';
        break;
      case 'HELP':
      default:
        action = 'HELP';
        reply = 'Commands: REG, CONF <id>, GRV <description>, STAT <id>, STOP, HELP';
    }

    sendSuccess(res, { action, reply });
  } catch (err) { next(err); }
});

webhooksRouter.post('/channels/sms/delivery-receipt', validate({ body: smsDeliveryReceiptSchema }), async (req, res, next) => {
  try {
    const { gateway_message_id, status } = req.body as { gateway_message_id: string; status: string };

    // Find matching notification by gateway reference (in production, SMS adapter stores the map)
    await prisma.notification.updateMany({
      where: {
        channel: 'SMS',
        status: 'SENT',
        // Would match on a stored gateway_message_id
      },
      data: {
        status: status === 'DELIVERED' ? 'DELIVERED' : status === 'FAILED' ? 'FAILED' : 'SENT',
        deliveredAt: status === 'DELIVERED' ? new Date() : undefined
      }
    });

    logger.info({ gateway_message_id, status }, 'SMS delivery receipt processed');
    sendSuccess(res, { received: true });
  } catch (err) { next(err); }
});

/* ════════════════════════════════════════════════════════════════════
 * USSD SESSION — receives menu navigation from feature phones
 * ════════════════════════════════════════════════════════════════════ */

webhooksRouter.post('/channels/ussd', validate({ body: ussdSessionSchema }), async (req, res, next) => {
  try {
    const { session_id, input, step } = req.body as { session_id: string; input: string; step?: number };
    logger.info({ session_id, step, input: input.slice(0, 50) }, 'USSD session event');

    let reply = 'Welcome to PIIMS\n1. Register\n2. Confirm service\n3. Submit grievance\n4. Check status\n5. Exit';
    let nextStep = 1;
    let action: 'CON' | 'END' = 'CON';

    if (step === 1) {
      switch (input.trim()) {
        case '1':
          reply = 'Enter your full name:';
          nextStep = 2;
          break;
        case '2':
          reply = 'Enter your beneficiary ID:';
          nextStep = 20;
          break;
        case '3':
          reply = 'Enter grievance description:';
          nextStep = 30;
          break;
        case '4':
          reply = 'Enter your ID to check status:';
          nextStep = 40;
          break;
        case '5':
          reply = 'Thank you. Goodbye.';
          action = 'END';
          break;
        default:
          reply = 'Invalid option. Please try again.';
      }
    } else if (step === 2) {
      reply = 'Registration in progress. You will receive an SMS confirmation.';
      action = 'END';
    }

    sendSuccess(res, { reply, action, next_step: nextStep });
  } catch (err) { next(err); }
});

/* ════════════════════════════════════════════════════════════════════
 * ODK WEBHOOK — receives submission notifications from ODK Central
 * ════════════════════════════════════════════════════════════════════ */

webhooksRouter.post('/collect/odk-webhook', validate({ body: odkWebhookSchema }), async (req, res, next) => {
  try {
    const { form_id, instance_id, submission_id } = req.body as {
      form_id: string;
      instance_id: string;
      submission_id?: string;
    };

    logger.info({ form_id, instance_id }, 'ODK submission webhook received');
    // In production: fetch the full submission from ODK, transform to PIIMS submission format

    sendSuccess(res, { received: true, submissionId: submission_id ?? instance_id });
  } catch (err) { next(err); }
});

/* ════════════════════════════════════════════════════════════════════
 * MOBILE MONEY CALLBACK — receives payment status from provider
 * ════════════════════════════════════════════════════════════════════ */

webhooksRouter.post('/payments/callback', validate({ body: mobileMoneyCallbackSchema }), async (req, res, next) => {
  try {
    const { reference, status, transaction_id } = req.body as {
      reference: string;
      status: string;
      transaction_id?: string;
    };

    logger.info({ reference, status, transaction_id }, 'Mobile money callback received');
    // In production: update Invoice/Payment status by reference

    sendSuccess(res, { received: true });
  } catch (err) { next(err); }
});