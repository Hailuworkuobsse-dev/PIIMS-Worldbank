import { describe, it, expect } from "vitest";
import { createProjectSchema, stepBudgetSchema } from "../project.schema";

describe("createProjectSchema", () => {
  const valid = {
    name: "Solar Mini-Grid Oromia Phase 1",
    nameAm: "",
    description: "",
    subsector: "",
    sector: "ENERGY" as const,
    ownerOrgId: "00000000-0000-0000-0000-000000000001",
    implementationArrangement: "PIU" as const,
    wbCreditNo: "",
    region: "Oromia",
    zone: "East Shewa",
    woreda: "Bora",
    kebele: "K1",
    totalBudget: { amount: "15000000.00", currency: "ETB" as const },
    startDate: "2026-10-01",
    endDate: "2029-09-30",
    financingSource: [
      {
        source: "WORLD_BANK" as const,
        amount: "12000000.00",
        currency: "ETB" as const,
        referenceNo: "IDA-X",
      },
      {
        source: "GOVERNMENT" as const,
        amount: "3000000.00",
        currency: "ETB" as const,
        referenceNo: "",
      },
    ],
  };

  it("accepts a valid project", () => {
    expect(createProjectSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects financing sum mismatch", () => {
    const bad = {
      ...valid,
      totalBudget: { amount: "99999999.00", currency: "ETB" as const },
    };
    const r = createProjectSchema.safeParse(bad);
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some((i) => i.path.includes("financingSource")),
      ).toBe(true);
    }
  });

  it("rejects name shorter than 3 chars", () => {
    expect(
      createProjectSchema.safeParse({ ...valid, name: "AB" }).success,
    ).toBe(false);
  });

  it("rejects end date before start date", () => {
    const r = stepBudgetSchema.safeParse({
      totalBudget: { amount: "100.00", currency: "ETB" },
      startDate: "2026-10-01",
      endDate: "2026-09-01",
      financingSource: [
        {
          source: "WORLD_BANK",
          amount: "100.00",
          currency: "ETB",
          referenceNo: "",
        },
      ],
    });
    expect(r.success).toBe(false);
  });
});