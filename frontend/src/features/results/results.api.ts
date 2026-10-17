import { api } from "@/lib/api/client";
import type {
  Component,
  SubComponent,
  Indicator,
  IndicatorValue,
  ResultsFilters,
  AggregationRow,
} from "./results.types";
import type {
  ComponentInput,
  SubComponentInput,
  IndicatorInput,
  IndicatorValueInput,
} from "./results.schema";

interface Envelope<T> {
  data: T;
}

export const resultsApi = {
  async listComponents(projectId: string): Promise<Component[]> {
    const { data } = await api.get<Envelope<Component[]>>(
      `/projects/${projectId}/components`,
    );
    return data.data;
  },

  async createComponent(
    projectId: string,
    input: ComponentInput,
  ): Promise<Component> {
    const { data } = await api.post<Envelope<Component>>(
      `/projects/${projectId}/components`,
      input,
    );
    return data.data;
  },

  async updateComponent(
    componentId: string,
    input: Partial<ComponentInput>,
  ): Promise<Component> {
    const { data } = await api.patch<Envelope<Component>>(
      `/components/${componentId}`,
      input,
    );
    return data.data;
  },

  async listSubcomponents(componentId: string): Promise<SubComponent[]> {
    const { data } = await api.get<Envelope<SubComponent[]>>(
      `/components/${componentId}/subcomponents`,
    );
    return data.data;
  },

  async createSubcomponent(
    componentId: string,
    input: SubComponentInput,
  ): Promise<SubComponent> {
    const { data } = await api.post<Envelope<SubComponent>>(
      `/components/${componentId}/subcomponents`,
      input,
    );
    return data.data;
  },

  async listIndicators(f: ResultsFilters): Promise<Indicator[]> {
    const p = new URLSearchParams();
    if (f.projectId) p.set("project_id", f.projectId);
    if (f.componentId) p.set("component_id", f.componentId);
    if (f.status?.length) p.set("status", f.status.join(","));
    if (f.type?.length) p.set("type", f.type.join(","));
    if (f.q) p.set("q", f.q);
    const { data } = await api.get<Envelope<Indicator[]>>(
      `/indicators?${p.toString()}`,
    );
    return data.data;
  },

  async createIndicator(input: IndicatorInput): Promise<Indicator> {
    const { data } = await api.post<Envelope<Indicator>>("/indicators", input);
    return data.data;
  },

  async updateIndicator(
    indicatorId: string,
    input: Partial<IndicatorInput>,
  ): Promise<Indicator> {
    const { data } = await api.patch<Envelope<Indicator>>(
      `/indicators/${indicatorId}`,
      input,
    );
    return data.data;
  },

  async getIndicator(indicatorId: string): Promise<Indicator> {
    const { data } = await api.get<Envelope<Indicator>>(
      `/indicators/${indicatorId}`,
    );
    return data.data;
  },

  async listValues(indicatorId: string): Promise<IndicatorValue[]> {
    const { data } = await api.get<Envelope<IndicatorValue[]>>(
      `/indicators/${indicatorId}/values`,
    );
    return data.data;
  },

  async recordValue(
    indicatorId: string,
    input: IndicatorValueInput,
  ): Promise<IndicatorValue> {
    const { data } = await api.post<Envelope<IndicatorValue>>(
      `/indicators/${indicatorId}/values`,
      input,
    );
    return data.data;
  },

  async aggregation(
    projectId: string,
    groupBy: "component" | "region" | "gender",
  ): Promise<AggregationRow[]> {
    const { data } = await api.get<Envelope<AggregationRow[]>>(
      `/results/aggregate?project_id=${projectId}&group_by=${groupBy}`,
    );
    return data.data;
  },

  async exportLogframe(projectId: string): Promise<Blob> {
    const { data } = await api.get(`/projects/${projectId}/logframe/export`, {
      responseType: "blob",
    });
    return data as unknown as Blob;
  },
};