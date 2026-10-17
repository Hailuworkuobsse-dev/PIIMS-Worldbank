// warehouse.api.ts
import { api } from "@/lib/api/client";
import type {
  WaveDataset,
  ResearchDataset,
  DataRequest,
  AnonymizationConfig,
  PanelLink,
} from "./warehouse.types";

interface Envelope<T> {
  data: T;
}

export const warehouseApi = {
  async waveDatasets(): Promise<WaveDataset[]> {
    const { data } = await api.get<Envelope<WaveDataset[]>>(
      "/warehouse/wave-datasets",
    );
    return data.data;
  },

  async buildWaveDataset(
    waveId: string,
  ): Promise<{ jobId: string; statusUrl: string }> {
    const { data } = await api.post<
      Envelope<{ jobId: string; statusUrl: string }>
    >(`/warehouse/wave-datasets/${waveId}/build`);
    return data.data;
  },

  async panelLinks(waveId?: string): Promise<PanelLink[]> {
    const p = waveId ? `?wave_id=${waveId}` : "";
    const { data } = await api.get<Envelope<PanelLink[]>>(
      `/warehouse/panel-links${p}`,
    );
    return data.data;
  },

  async researchDatasets(): Promise<ResearchDataset[]> {
    const { data } =
      await api.get<Envelope<ResearchDataset[]>>("/research/datasets");
    return data.data;
  },

  async anonymize(
    waveId: string,
    config: AnonymizationConfig,
  ): Promise<ResearchDataset> {
    const { data } = await api.post<Envelope<ResearchDataset>>(
      `/research/datasets/anonymize`,
      { wave_id: waveId, config },
    );
    return data.data;
  },

  async requestAccess(
    datasetId: string,
    payload: {
      researcherName: string;
      researcherEmail: string;
      institution: string;
      purpose: string;
    },
  ): Promise<DataRequest> {
    const { data } = await api.post<Envelope<DataRequest>>(
      `/research/datasets/${datasetId}/request`,
      payload,
    );
    return data.data;
  },

  async download(
    datasetId: string,
    requestId: string,
    format: string,
  ): Promise<{ url: string }> {
    const { data } = await api.post<Envelope<{ url: string }>>(
      `/research/datasets/${datasetId}/download`,
      { request_id: requestId, format },
    );
    return data.data;
  },

  async requests(): Promise<DataRequest[]> {
    const { data } =
      await api.get<Envelope<DataRequest[]>>("/research/requests");
    return data.data;
  },
};