import { describe, it, expect } from "vitest";
import { indicatorSchema, indicatorValueSchema } from "../results.schema";

describe("indicatorSchema", () => {
  it("accepts valid indicator", () => {
    const r = indicatorSchema.safeParse({
      subcomponentId: "00000000-0000-0000-0000-000000000001",
      code: "IND-001",
      name: "Households with solar systems",
      indicatorType: "OUTPUT",
      unit: "households",
      baseline: 0,
      target: 5000,
      frequency: "QUARTERLY",
      direction: "INCREASE",
    });
    expect(r.success).toBe(true);
  });

  it("rejects missing unit", () => {
    const r = indicatorSchema.safeParse({
      subcomponentId: "00000000-0000-0000-0000-000000000001",
      code: "IND-001",
      name: "Test",
      indicatorType: "OUTPUT",
      unit: "",
      frequency: "QUARTERLY",
      direction: "INCREASE",
    });
    expect(r.success).toBe(false);
  });
});

describe("indicatorValueSchema", () => {
  it("accepts numeric value", () => {
    const r = indicatorValueSchema.safeParse({
      period: "Q3-2026",
      fiscalYear: 2019,
      value: 4250,
    });
    expect(r.success).toBe(true);
  });

  it("rejects non-numeric value", () => {
    const r = indicatorValueSchema.safeParse({
      period: "Q3-2026",
      fiscalYear: 2019,
      value: "abc",
    });
    expect(r.success).toBe(false);
  });
});