import { api } from "@/lib/api/client";
import type {
  BeneficiaryMarker,
  InterventionMarker,
  GeoFilters,
  GeoVerifyRequest,
  GeoVerifyResponse,
  GeoPoint,
} from "./geo.types";

interface Envelope<T> {
  data: T;
}

export const geoApi = {
  async beneficiaries(f: GeoFilters): Promise<BeneficiaryMarker[]> {
    const p = new URLSearchParams();
    if (f.bounds) {
      p.set(
        "bbox",
        `${f.bounds.west},${f.bounds.south},${f.bounds.east},${f.bounds.north}`,
      );
    }
    if (f.region) p.set("region", f.region);
    if (f.woreda) p.set("woreda", f.woreda);
    if (f.status?.length) p.set("status", f.status.join(","));
    const { data } = await api.get<Envelope<BeneficiaryMarker[]>>(
      `/geo/beneficiaries?${p.toString()}`,
    );
    return data.data;
  },

  async interventions(f: GeoFilters): Promise<InterventionMarker[]> {
    const p = new URLSearchParams();
    if (f.bounds) {
      p.set(
        "bbox",
        `${f.bounds.west},${f.bounds.south},${f.bounds.east},${f.bounds.north}`,
      );
    }
    if (f.projectId) p.set("project_id", f.projectId);
    const { data } = await api.get<Envelope<InterventionMarker[]>>(
      `/geo/interventions?${p.toString()}`,
    );
    return data.data;
  },

  async verify(req: GeoVerifyRequest): Promise<GeoVerifyResponse> {
    const { data } = await api.post<Envelope<GeoVerifyResponse>>(
      "/geo/verify",
      req,
    );
    return data.data;
  },

  async geocode(query: string): Promise<GeoPoint | null> {
    const { data } = await api.get<Envelope<GeoPoint | null>>(
      `/geo/geocode?q=${encodeURIComponent(query)}`,
    );
    return data.data;
  },
};