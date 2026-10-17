import { BaseAdapter } from './base.adapter.js';
import type { AdapterHealth, IntegrationCode } from '../integration.types.js';

interface OdkSubmission {
  instanceId: string;
  submitterId: string;
  submittedAt: string;
  data: Record<string, unknown>;
}

class OdkAdapter extends BaseAdapter {
  readonly code: IntegrationCode = 'ODK';

  constructor() {
    super(process.env.ODK_BASE_URL, process.env.ODK_API_KEY, 30_000);
  }

  async listProjects(): Promise<Array<{ id: number; name: string }>> {
    const result = await this.request<Array<{ id: number; name: string }>>({
      method: 'GET',
      url: '/v1/projects'
    });
    return result ?? [];
  }

  async listSubmissions(formId: string, since?: string): Promise<OdkSubmission[]> {
    const result = await this.request<{ value: OdkSubmission[] }>({
      method: 'GET',
      url: `/v1/projects/1/forms/${formId}/submissions`,
      params: since ? { since } : undefined
    });
    return result.value ?? [];
  }

  async publishForm(formXml: string, formName: string): Promise<{ formId: string }> {
    return this.request<{ formId: string }>({
      method: 'POST',
      url: '/v1/projects/1/forms',
      data: { name: formName, xml: formXml },
      headers: { 'Content-Type': 'application/xml' }
    });
  }

  async testConnection(): Promise<AdapterHealth> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'ODK_BASE_URL not configured' };
    }
    const start = Date.now();
    try {
      await this.listProjects();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  }
}

export const odkAdapter = new OdkAdapter();