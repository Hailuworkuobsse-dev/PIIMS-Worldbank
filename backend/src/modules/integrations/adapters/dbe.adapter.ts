import { BaseAdapter } from './base.adapter.js';
import type { AdapterHealth, IntegrationCode } from '../integration.types.js';

export interface DbeLoan {
  loanId: string;
  projectCode: string;
  amount: string;
  currency: string;
  interestRate: number;
  tenorMonths: number;
  signedDate: string;
  status: string;
}

export interface DbePayment {
  paymentId: string;
  loanId: string;
  supplierId: string;
  amount: string;
  currency: string;
  status: string;
  paidAt?: string;
}

class DbeAdapter extends BaseAdapter {
  readonly code: IntegrationCode = 'DBE';

  constructor() {
    super(process.env.DBE_BASE_URL, process.env.DBE_API_KEY, 60_000);
  }

  async fetchLoans(): Promise<DbeLoan[]> {
    const result = await this.request<{ data: DbeLoan[] }>({
      method: 'GET',
      url: '/dbe/api/v1/loans'
    });
    return result.data ?? [];
  }

  async fetchSupplierPayments(loanId: string): Promise<DbePayment[]> {
    const result = await this.request<{ data: DbePayment[] }>({
      method: 'GET',
      url: `/dbe/api/v1/loans/${loanId}/payments`
    });
    return result.data ?? [];
  }

  async pushDisbursement(payload: {
    loanId: string;
    projectCode: string;
    disbursementId: string;
    amount: string;
    currency: string;
    supplierId: string;
    valueDate: string;
  }): Promise<{ dbeReference: string }> {
    return this.request<{ dbeReference: string }>({
      method: 'POST',
      url: '/dbe/api/v1/disbursements',
      data: payload
    });
  }

  async testConnection(): Promise<AdapterHealth> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'DBE_BASE_URL not configured' };
    }
    const start = Date.now();
    try {
      await this.request({ method: 'GET', url: '/dbe/api/v1/ping' });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  }
}

export const dbeAdapter = new DbeAdapter();