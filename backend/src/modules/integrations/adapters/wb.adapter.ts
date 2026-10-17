import { BaseAdapter } from './base.adapter.js';
import type { AdapterHealth, IntegrationCode } from '../integration.types.js';

class WbAdapter extends BaseAdapter {
  readonly code: IntegrationCode = 'WB';

  constructor() {
    super(process.env.WB_BASE_URL, undefined, 120_000);
  }

  /**
   * Push ISR/PPMR XML export. In production, this uses SFTP.
   * For MVP, we POST the XML to an HTTP endpoint.
   */
  async pushIsr(xmlContent: string, period: string): Promise<{ acknowledged: boolean; reference?: string }> {
    return this.request<{ acknowledged: boolean; reference?: string }>({
      method: 'POST',
      url: '/wb/api/v1/isr',
      data: { period, xml: xmlContent },
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async testConnection(): Promise<AdapterHealth> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'WB_BASE_URL not configured' };
    }
    const start = Date.now();
    try {
      await this.request({ method: 'GET', url: '/wb/api/v1/ping' });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  }
}

export const wbAdapter = new WbAdapter();