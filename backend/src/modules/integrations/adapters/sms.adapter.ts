import { BaseAdapter } from './base.adapter.js';
import type { AdapterHealth, IntegrationCode } from '../integration.types.js';

interface SendSmsRequest {
  msisdn: string;
  message: string;
  reference?: string;
}

interface SendSmsResponse {
  messageId: string;
  status: string;
}

class SmsAdapter extends BaseAdapter {
  readonly code: IntegrationCode = 'SMS';

  constructor() {
    super(process.env.SMS_GATEWAY_URL, process.env.SMS_GATEWAY_KEY, 10_000);
  }

  async send(req: SendSmsRequest): Promise<SendSmsResponse> {
    return this.request<SendSmsResponse>({
      method: 'POST',
      url: '/sms/api/v1/send',
      data: {
        to: req.msisdn,
        message: req.message,
        sender: process.env.SMS_SENDER_ID ?? 'PIIMS',
        reference: req.reference
      }
    });
  }

  async testConnection(): Promise<AdapterHealth> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'SMS_GATEWAY_URL not configured' };
    }
    const start = Date.now();
    try {
      await this.request({ method: 'GET', url: '/sms/api/v1/ping' });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  }
}

export const smsAdapter = new SmsAdapter();