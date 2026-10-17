import { BaseAdapter } from './base.adapter.js';
import type { AdapterHealth, IntegrationCode } from '../integration.types.js';

class IdpAdapter extends BaseAdapter {
  readonly code: IntegrationCode = 'IDP';

  constructor() {
    super(process.env.IDP_ISSUER_URL, process.env.IDP_CLIENT_ID, 10_000);
  }

  /**
   * Fetch the OIDC discovery document.
   */
  async discover(): Promise<{
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
    jwks_uri: string;
    userinfo_endpoint: string;
  }> {
    return this.request({
      method: 'GET',
      url: '/.well-known/openid-configuration'
    });
  }

  /**
   * Fetch the JWKS for token verification.
   */
  async fetchJwks(): Promise<{ keys: unknown[] }> {
    const discovery = await this.discover();
    return this.request({
      method: 'GET',
      url: discovery.jwks_uri
    });
  }

  async testConnection(): Promise<AdapterHealth> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'IDP_ISSUER_URL not configured' };
    }
    const start = Date.now();
    try {
      await this.discover();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  }
}

export const idpAdapter = new IdpAdapter();