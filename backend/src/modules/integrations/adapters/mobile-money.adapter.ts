import { BaseAdapter } from './base.adapter.js';
import type { AdapterHealth, IntegrationCode } from '../integration.types.js';

interface InitiatePaymentRequest {
  msisdn: string;
  amount: string;
  currency: string;
  reference: string;
  purpose: string;
}

interface InitiatePaymentResponse {
  transactionId: string;
  status: string;
}

class MobileMoneyAdapter extends BaseAdapter {
  readonly code: IntegrationCode = 'MOBILE_MONEY';

  constructor() {
    super(process.env.MOBILE_MONEY_BASE_URL, process.env.MOBILE_MONEY_KEY, 15_000);
  }

  async initiatePayment(req: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    return this.request<InitiatePaymentResponse>({
      method: 'POST',
      url: '/mm/api/v1/payments',
      data: {
        msisdn: req.msisdn,
        amount: req.amount,
        currency: req.currency,
        reference: req.reference,
        purpose: req.purpose,
        merchant: process.env.MOBILE_MONEY_MERCHANT
      }
    });
  }

  async testConnection(): Promise<AdapterHealth> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'MOBILE_MONEY_BASE_URL not configured' };
    }
    const start = Date.now();
    try {
      await this.request({ method: 'GET', url: '/mm/api/v1/ping' });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  }
}

export const mobileMoneyAdapter = new MobileMoneyAdapter();