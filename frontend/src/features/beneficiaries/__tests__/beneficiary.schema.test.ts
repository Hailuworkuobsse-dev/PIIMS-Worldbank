import { describe, it, expect } from "vitest";
import {
  beneficiaryWithConsentSchema,
  beneficiarySchema,
} from "../beneficiary.schema";

const base = {
  fullName: "Aster Bekele",
  gender: "FEMALE" as const,
  location: { region: "Oromia", woreda: "Bora", kebele: "K1" },
  registrationChannel: "WEB" as const,
};

describe("beneficiarySchema", () => {
  it("accepts valid input", () => {
    expect(beneficiarySchema.safeParse(base).success).toBe(true);
  });

  it("rejects invalid phone", () => {
    const r = beneficiarySchema.safeParse({ ...base, phone: "12345" });
    expect(r.success).toBe(false);
  });

  it("accepts valid Ethiopian phone", () => {
    const r = beneficiarySchema.safeParse({ ...base, phone: "+251911234567" });
    expect(r.success).toBe(true);
    const r2 = beneficiarySchema.safeParse({ ...base, phone: "0911234567" });
    expect(r2.success).toBe(true);
  });

  it("requires region", () => {
    const r = beneficiarySchema.safeParse({
      ...base,
      location: { region: "" },
    });
    expect(r.success).toBe(false);
  });
});

describe("beneficiaryWithConsentSchema", () => {
  it("requires participation + data_use consent", () => {
    const r = beneficiaryWithConsentSchema.safeParse({
      ...base,
      consent: {
        participation: true,
        data_use: true,
        consent_version: "v1.2",
        language: "en",
      },
    });
    expect(r.success).toBe(true);
  });

  it("rejects missing data_use", () => {
    const r = beneficiaryWithConsentSchema.safeParse({
      ...base,
      consent: {
        participation: true,
        data_use: false,
        consent_version: "v1.2",
        language: "en",
      },
    });
    expect(r.success).toBe(false);
  });
});