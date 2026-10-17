import { BaseAdapter } from './base.adapter.js';
import type { AdapterHealth, IntegrationCode } from '../integration.types.js';

class SafeRoomAdapter extends BaseAdapter {
  readonly code: IntegrationCode = 'SAFE_ROOM';

  constructor() {
    super(process.env.SAFE_ROOM_URL, undefined, 120_000);
  }

  /**
   * Push an anonymized dataset to the safe room.
   * In production, use SFTP. For MVP, we POST to an HTTP endpoint.
   */
  async pushDataset(payload: {
    datasetId: string;
    format: string;
    checksum: string;
    content: Buffer;
  }): Promise<{ acknowledged: boolean; reference?: string }> {
    return this.request<{ acknowledged: boolean; reference?: string }>({
      method: 'POST',
      url: '/saferoom/api/v1/datasets',
      data: {
        datasetId: payload.datasetId,
        format: payload.format,
        checksum: payload.checksum,
        contentBase64: payload.content.toString('base64')
      }
    });
  }

  async testConnection(): Promise<AdapterHealth> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'SAFE_ROOM_URL not configured' };
    }
    const start = Date.now();
    try {
      await this.request({ method: 'GET', url: '/saferoom/api/v1/ping' });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  }
}

export const safeRoomAdapter = new SafeRoomAdapter();