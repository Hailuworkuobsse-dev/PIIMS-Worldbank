import { api } from "@/lib/api/client";
import type {
  ImpactIndicator,
  ImpactIndicatorFilters,
  CompositeFormula,
  TheoryOfChange,
} from "./impactIndicator.types";
import type {
  ImpactIndicatorFormData,
  CompositeFormData,
  WaveAssignmentFormData,
} from "./impactIndicator.schema";

interface Envelope<T> {
  data: T;
}

export const impactIndicatorApi = {
  async list(f: ImpactIndicatorFilters): Promise<ImpactIndicator[]> {
    const p = new URLSearchParams();
    if (f.domain?.length) p.set("domain", f.domain.join(","));
    if (f.q) p.set("q", f.q);
    if (f.status) p.set("status", f.status);
    const { data } = await api.get<Envelope<ImpactIndicator[]>>(
      `/impact-indicators?${p.toString()}`,
    );
    return data.data;
  },

  async get(id: string): Promise<ImpactIndicator> {
    const { data } = await api.get<Envelope<ImpactIndicator>>(
      `/impact-indicators/${id}`,
    );
    return data.data;
  },

  async create(input: ImpactIndicatorFormData): Promise<ImpactIndicator> {
    const { data } = await api.post<Envelope<ImpactIndicator>>(
      "/impact-indicators",
      input,
    );
    return data.data;
  },

  async update(
    id: string,
    patch: Partial<ImpactIndicatorFormData>,
  ): Promise<ImpactIndicator> {
    const { data } = await api.patch<Envelope<ImpactIndicator>>(
      `/impact-indicators/${id}`,
      patch,
    );
    return data.data;
  },

  async assignWave(
    input: WaveAssignmentFormData,
  ): Promise<{ assignmentId: string }> {
    const { data } = await api.post<Envelope<{ assignmentId: string }>>(
      `/impact-indicators/${input.indicatorId}/waves`,
      input,
    );
    return data.data;
  },

  async createComposite(input: CompositeFormData): Promise<ImpactIndicator> {
    const { data } = await api.post<Envelope<ImpactIndicator>>(
      "/impact-indicators/composite",
      input,
    );
    return data.data;
  },

  async theoryOfChange(projectId: string): Promise<TheoryOfChange | null> {
    const { data } = await api.get<Envelope<TheoryOfChange | null>>(
      `/projects/${projectId}/toc`,
    );
    return data.data;
  },

  async standardLibrary(): Promise<
    { code: string; name: string; domain: ImpactDomain; unit: string }[]
  > {
    const { data } = await api.get<
      Envelope<
        { code: string; name: string; domain: ImpactDomain; unit: string }[]
      >
    >("/impact-indicators/standard-library");
    return data.data;
  },
};

// Type-only re-export for use in the API surface
type ImpactDomain = ImpactIndicator["domain"];