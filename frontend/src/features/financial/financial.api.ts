import { api } from "@/lib/api/client";
import type {
  Budget,
  Disbursement,
  FinancialExecution,
  FmisSyncRun,
  CostPerOutputRow,
  FinancialException,
  BudgetFilters,
  DisbursementFilters,
} from "./financial.types";
import type { BudgetFormData, DisbursementFormData } from "./financial.schema";

interface Envelope<T> {
  data: T;
}

function dFiltersToParams(f: DisbursementFilters): string {
  const p = new URLSearchParams();
  if (f.projectId) p.set("project_id", f.projectId);
  if (f.status?.length) p.set("status", f.status.join(","));
  if (f.sourceOrgId) p.set("source_org_id", f.sourceOrgId);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.q) p.set("q", f.q);
  if (f.limit) p.set("limit", String(f.limit));
  if (f.cursor) p.set("cursor", f.cursor);
  return p.toString();
}

export const financialApi = {
  async listBudgets(f: BudgetFilters): Promise<Budget[]> {
    const p = new URLSearchParams();
    if (f.projectId) p.set("project_id", f.projectId);
    if (f.fiscalYear) p.set("fiscal_year", String(f.fiscalYear));
    if (f.componentId) p.set("component_id", f.componentId);
    const { data } = await api.get<Envelope<Budget[]>>(
      `/budgets?${p.toString()}`,
    );
    return data.data;
  },

  async createBudget(input: BudgetFormData): Promise<Budget> {
    const { data } = await api.post<Envelope<Budget>>("/budgets", input);
    return data.data;
  },

  async execution(
    projectId: string,
    fiscalYear?: number,
  ): Promise<FinancialExecution> {
    const p = new URLSearchParams({ project_id: projectId });
    if (fiscalYear) p.set("fiscal_year", String(fiscalYear));
    const { data } = await api.get<Envelope<FinancialExecution>>(
      `/finance/execution?${p.toString()}`,
    );
    return data.data;
  },

  async listDisbursements(f: DisbursementFilters) {
    const { data } = await api.get<
      Envelope<Disbursement[]> & { pagination: any }
    >(`/disbursements?${dFiltersToParams(f)}`);
    return { data: data.data, pagination: (data as any).pagination };
  },

  async createDisbursement(input: DisbursementFormData): Promise<Disbursement> {
    const { data } = await api.post<Envelope<Disbursement>>(
      "/disbursements",
      input,
    );
    return data.data;
  },

  async fmisRuns(): Promise<FmisSyncRun[]> {
    const { data } =
      await api.get<Envelope<FmisSyncRun[]>>("/finance/fmis/runs");
    return data.data;
  },

  async triggerFmisSync(
    kind: "APPROPRIATION" | "RELEASE" | "EXPENDITURE",
  ): Promise<{ jobId: string; statusUrl: string }> {
    const { data } = await api.post<
      Envelope<{ jobId: string; statusUrl: string }>
    >("/finance/sync-fmis", { kind });
    return data.data;
  },

  async costPerOutput(projectId: string): Promise<CostPerOutputRow[]> {
    const { data } = await api.get<Envelope<CostPerOutputRow[]>>(
      `/finance/cost-per-output?project_id=${projectId}`,
    );
    return data.data;
  },

  async exceptions(projectId?: string): Promise<FinancialException[]> {
    const p = projectId ? `?project_id=${projectId}` : "";
    const { data } = await api.get<Envelope<FinancialException[]>>(
      `/finance/exceptions${p}`,
    );
    return data.data;
  },
};