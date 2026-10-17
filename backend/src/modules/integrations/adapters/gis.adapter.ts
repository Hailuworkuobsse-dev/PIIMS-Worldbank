import { BaseAdapter } from './base.adapter.js';
import type { AdapterHealth, IntegrationCode } from '../integration.types.js';

interface BoundaryFeature {
  level: 'REGION' | 'ZONE' | 'WOREDA' | 'KEBELE';
  code: string;
  name: string;
  geometry: { type: string; coordinates: unknown };
}

class GisAdapter extends BaseAdapter {
  readonly code: IntegrationCode = 'GIS';

  constructor() {
    super(process.env.GIS_BASE_URL, process.env.GIS_API_KEY, 30_000);
  }

  async fetchBoundaries(level: string): Promise<BoundaryFeature[]> {
    const result = await this.request<{ features: BoundaryFeature[] }>({
      method: 'GET',
      url: '/gis/api/v1/boundaries',
      params: { level }
    });
    return result.features ?? [];
  }

  async pushMarkers(markers: Array<{ id: string; lat: number; lon: number; type: string }>): Promise<void> {
    await this.request<void>({
      method: 'POST',
      url: '/gis/api/v1/markers',
      data: { markers }
    });
  }

  async testConnection(): Promise<AdapterHealth> {
    if (!this.isConfigured()) {
      return { healthy: false, latencyMs: 0, message: 'GIS_BASE_URL not configured' };
    }
    const start = Date.now();
    try {
      await this.request({ method: 'GET', url: '/gis/api/v1/ping' });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err) {
      return { healthy: false, latencyMs: Date.now() - start, message: (err as Error).message };
    }
  }
}

export const gisAdapter = new GisAdapter();