import { describe, it, expect } from "vitest";
import { disbursementFormSchema, budgetFormSchema } from "../financial.schema";

describe("disbursementFormSchema", () => {
  it("accepts valid disbursement", () => {
    const r = disbursementFormSchema.safeParse({
      projectId: "00000000-0000-0000-0000-000000000001",
      sourceOrgId: "00000000-0000-0000-0000-000000000002",
      category: "CATEGORY_1",
      amount: "1500000.00",
      currency: "ETB",
      valueDate: "2026-10-15",
      referenceNo: "WB-DISB-2026-001234",
      status: "APPROVED",
    });
    expect(r.success).toBe(true);
  });

  it("rejects invalid amount", () => {
    const r = disbursementFormSchema.safeParse({
      projectId: "00000000-0000-0000-0000-000000000001",
      sourceOrgId: "00000000-0000-0000-0000-000000000002",
      category: "CATEGORY_1",
      amount: "abc",
      currency: "ETB",
      valueDate: "2026-10-15",
    });
    expect(r.success).toBe(false);
  });

  it("rejects missing value date", () => {
    const r = disbursementFormSchema.safeParse({
      projectId: "00000000-0000-0000-0000-000000000001",
      sourceOrgId: "00000000-0000-0000-0000-000000000002",
      category: "CATEGORY_1",
      amount: "100.00",
      currency: "ETB",
      valueDate: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("budgetFormSchema", () => {
  it("accepts whole-project budget (no component)", () => {
    const r = budgetFormSchema.safeParse({
      projectId: "00000000-0000-0000-0000-000000000001",
      componentId: "",
      fiscalYear: 2019,
      currency: "ETB",
      appropriation: "5000000.00",
      notes: "",
    });
    expect(r.success).toBe(true);
  });
});