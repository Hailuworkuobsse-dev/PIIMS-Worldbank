import { BaseAdapter } from './base.adapter.js';
import type { AdapterHealth, IntegrationCode } from '../integration.types.js';

export interface FmisAppropriation {
  projectCode: string;
  budgetCode: string;
  fiscalYear: number;
  appropriation: string;
  currency: string;
  approvedDate: string;
}

export interface FmisRelease {
  releaseId: string;
  projectCode: string;
  budgetCode: string;
  amount: string;
  currency: string;
  releaseDate: string;
  referenceNo: string;
}

export interface FmisExpenditure {
  expenditureId: string;
  projectCode: string;
  budgetCode: string;
  amount: string;
  currency: string;
  postingDate: string;
  description: string;
  voucherNo: string;
}

class FmisAdapter extends BaseAdapter {
  readonly code: IntegrationCode = 'FMIS';

  constructor() {
    super(process.env.FMIS_BASE_URL, process.env.FMIS_API_KEY, 60_000);
  }

  async fetchAppropriations(fiscalYear: number): Promise<FmisAppropriation[]> {
    const result = await this.request<{ data: FmisAppropriation[] }>({
      method: 'GET',
      url: '/api/v1/appropriations',
      params: { fiscal_year: fiscalYear }
    });
    return result.data ?? [];
  }

  async fetchReleases(since: string): Promise<FmisRelease[]> {
    const result = await this.request<{ data: FmisRelease[] }>({
      method: 'GET',
      url: '/api/v1/releases',
      params: { since }
    });
    return result.data ?? [];
  }

  async fetchExpenditures(since: string): Promise<FmisExpenditure[]> {
    const result = await this.request<{ data: FmisExpenditure[] }>({
      method: 'GET',
      url: '/api/v1/expenditures',
      params: { since }
    });
    return result.data ?? [];
  }

  async pushDisbursement(payload: {
    projectCode: string;
    disbursementId: string;
    source: string;
    category: string;
    amount: string;
    currency: string;
    valueDate: string;
    referenceNo?: string;
  }): Promise<{ fmisReference: string }> {
    return this.request<{ fmisReference: string }>({
      method: 'POST',
      url: '/api/v1/piims/disbursements',
      data: payload
    });
  }

  async testConnection(): Promise<AdapterHealth> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'FMIS_BASE_URL not configured' };
    }
    const start = Date.now();
    try {
      await this.request({ method: 'GET', url: '/api/v1/ping' });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  }
}

export const fmisAdapter = new FmisAdapter();