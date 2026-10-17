import { describe, it, expect } from "vitest";
import {
  reviewDecisionSchema,
  submitInceptionSchema,
} from "../inception.schema";

describe("reviewDecisionSchema", () => {
  it("allows APPROVE without comments", () => {
    expect(
      reviewDecisionSchema.safeParse({ decision: "APPROVE" }).success,
    ).toBe(true);
  });

  it("requires ≥10-char comment for REQUEST_REVISION", () => {
    expect(
      reviewDecisionSchema.safeParse({
        decision: "REQUEST_REVISION",
        comments: "short",
      }).success,
    ).toBe(false);
    expect(
      reviewDecisionSchema.safeParse({
        decision: "REQUEST_REVISION",
        comments: "Please revise section 2.",
      }).success,
    ).toBe(true);
  });

  it("rejects REJECT without comments", () => {
    expect(reviewDecisionSchema.safeParse({ decision: "REJECT" }).success).toBe(
      false,
    );
  });
});

describe("submitInceptionSchema", () => {
  it("rejects summary shorter than 20 chars", () => {
    const r = submitInceptionSchema.safeParse({
      projectId: "00000000-0000-0000-0000-000000000001",
      templateId: "00000000-0000-0000-0000-000000000002",
      version: 1,
      summary: "Too short",
    });
    expect(r.success).toBe(false);
  });
});