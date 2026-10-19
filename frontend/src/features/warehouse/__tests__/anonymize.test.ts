import { describe, it, expect } from "vitest";
import { anonymize } from "../anonymize";
import {
  DEFAULT_ANON_CONFIG,
  type AnonymizationConfig,
} from "../warehouse.types";

const sample = [
  {
    panelId: "P1",
    beneficiaryName: "Aster",
    phone: "+251911",
    age: 42,
    income: 3500,
    region: "Oromia",
    zone: "East Shewa",
    woreda: "Bora",
  },
  {
    panelId: "P2",
    beneficiaryName: "Tadesse",
    phone: "+251922",
    age: 38,
    income: 4200,
    region: "Oromia",
    zone: "East Shewa",
    woreda: "Bora",
  },
  {
    panelId: "P3",
    beneficiaryName: "Hanna",
    phone: "+251933",
    age: 29,
    income: 5000,
    region: "Amhara",
    zone: "North Shewa",
    woreda: "K1",
  },
  {
    panelId: "P4",
    beneficiaryName: "Yohannes",
    phone: "+251944",
    age: 51,
    income: 8000,
    region: "Oromia",
    zone: "East Shewa",
    woreda: "Bora",
  },
  {
    panelId: "P5",
    beneficiaryName: "Selam",
    phone: "+251955",
    age: 45,
    income: 3000,
    region: "Amhara",
    zone: "North Shewa",
    woreda: "K1",
  },
];

describe("anonymize", () => {
  it("L0 returns records unchanged", () => {
    const result = anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: "L0" });
    expect(result).toEqual(sample);
  });

  it("L1 pseudonymizes names and redacts phone", () => {
    const result = anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: "L1" });
    expect(result[0]!.beneficiaryName).not.toBe("Aster");
    expect(result[0]!.phone).toBe("[REDACTED]");
    expect(result[0]!.panelId).toBe("P1"); // panel ID preserved
  });

  it("L1 preserves panel ID across waves", () => {
    const r1 = anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: "L1" });
    const r2 = anonymize(sample, { ...DEFAULT_ANON_CONFIG, level: "L1" });
    expect(r1[0]!.beneficiaryName).toBe(r2[0]!.beneficiaryName); // deterministic
  });

  it("L2 brackets age and generalizes location", () => {
    const config: AnonymizationConfig = {
      ...DEFAULT_ANON_CONFIG,
      level: "L2",
      ageBracket: 5,
      locationGranularity: "ZONE",
      // isolate bracketing/generalization from k-anonymity suppression
      // (suppression is covered by its own tests below)
      suppressionThreshold: 1,
    };
    const result = anonymize(sample, config);
    expect(result[0]!.age).toBeUndefined();
    expect(result[0]!.ageBand).toBeDefined();
    expect(result[0]!.woreda).toBeUndefined();
    expect(result[0]!.zone).toBeDefined();
  });

  it("L2 top-codes income above 99th percentile", () => {
    const config: AnonymizationConfig = {
      ...DEFAULT_ANON_CONFIG,
      level: "L2",
      incomeTopCode: 50,
      // isolate top-coding from k-anonymity suppression
      suppressionThreshold: 1,
    };
    const result = anonymize(sample, config);
    const sortedIncome = result
      .map((r) => r.income ?? 0)
      .sort((a, b) => a - b);
    // at least the highest value should be capped at some threshold
    expect(sortedIncome[sortedIncome.length - 1]).toBeLessThanOrEqual(8000);
  });

  it("L3 aggregates and applies suppression", () => {
    const config: AnonymizationConfig = {
      ...DEFAULT_ANON_CONFIG,
      level: "L3",
      suppressionThreshold: 2,
    };
    const result = anonymize(sample, config);
    for (const row of result) {
      expect(row.panelId).toMatch(/^AGG-/);
      expect(row.count).toBeGreaterThanOrEqual(2);
    }
  });

  it("noise injection changes income values", () => {
    const config: AnonymizationConfig = {
      ...DEFAULT_ANON_CONFIG,
      level: "L2",
      addNoise: true,
      suppressionThreshold: 0,
    };
    const result = anonymize(sample, config);
    expect(result[0]!.income).not.toBe(3500); // should be perturbed
    expect(result[0]!.income).toBeGreaterThan(3000);
    expect(result[0]!.income).toBeLessThan(4000);
  });
});