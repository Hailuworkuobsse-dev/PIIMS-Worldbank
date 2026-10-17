import { describe, it, expect } from "vitest";
import {
  grievanceIntakeSchema,
  grievanceResolveSchema,
} from "../grievance.schema";

describe("grievanceIntakeSchema", () => {
  it("accepts valid intake", () => {
    const r = grievanceIntakeSchema.safeParse({
      category: "DELAY",
      description: "Installation was 3 months late.",
      channel: "IN_PERSON",
      severity: "MEDIUM",
      anonymous: false,
    });
    expect(r.success).toBe(true);
  });

  it("rejects short description", () => {
    const r = grievanceIntakeSchema.safeParse({
      category: "DELAY",
      description: "late",
      channel: "IN_PERSON",
      severity: "MEDIUM",
    });
    expect(r.success).toBe(false);
  });
});

describe("grievanceResolveSchema", () => {
  it("requires at least 20 characters for resolution", () => {
    expect(
      grievanceResolveSchema.safeParse({ resolution: "short" }).success,
    ).toBe(false);
    expect(
      grievanceResolveSchema.safeParse({
        resolution: "Installation completed and verified by field supervisor.",
      }).success,
    ).toBe(true);
  });
});