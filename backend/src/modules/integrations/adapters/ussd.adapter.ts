import { BaseAdapter } from './base.adapter.js';
import type { AdapterHealth, IntegrationCode } from '../integration.types.js';

class UssdAdapter extends BaseAdapter {
  readonly code: IntegrationCode = 'USSD';

  constructor() {
    super(process.env.USSD_GATEWAY_URL, process.env.USSD_GATEWAY_KEY, 10_000);
  }

  /**
   * Send a menu response back to the USSD gateway. Called from webhook handler
   * when a user dials *888# and navigates the menu tree.
   */
  async respond(sessionId: string, reply: string, action: 'CON' | 'END'): Promise<void> {
    await this.request<void>({
      method: 'POST',
      url: '/ussd/api/v1/respond',
      data: { session_id: sessionId, reply, action }
    });
  }

  async testConnection(): Promise<AdapterHealth> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'USSD_GATEWAY_URL not configured' };
    }
    const start = Date.now();
    try {
      await this.request({ method: 'GET', url: '/ussd/api/v1/ping' });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  }
}

export const ussdAdapter = new UssdAdapter();