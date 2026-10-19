import { describe, it, expect } from "vitest";
import { projectScopeWhere, canAccessProject } from "../scope.js";

describe("projectScopeWhere", () => {
  it("returns empty filter for FEDERAL scope", () => {
    const where = projectScopeWhere({ orgLevel: "FEDERAL" }, "org-1", "user-1");
    expect(where).toEqual({});
  });

  it("returns own-records filter for ownRecordsOnly", () => {
    const where = projectScopeWhere(
      { orgLevel: "FEDERAL", ownRecordsOnly: true },
      "org-1",
      "user-1"
    );
    expect(where.OR).toBeDefined();
    expect(Array.isArray(where.OR)).toBe(true);
  });

  it("includes org-owned and created-by clauses for scoped users", () => {
    const where = projectScopeWhere(
      { orgLevel: "WOREDA", woredas: ["Bora"] },
      "org-1",
      "user-1"
    );
    expect(where.OR).toBeDefined();
    const clauses = where.OR as unknown[];
    expect(clauses.length).toBeGreaterThan(0);
  });
});

describe("canAccessProject", () => {
  const project = {
    ownerOrgId: "org-1",
    createdById: "user-1",
    location: { region: "Oromia", zone: "East Shewa", woreda: "Bora", kebele: "K1" }
  };

  it("federal user can access any project", () => {
    expect(canAccessProject({ orgLevel: "FEDERAL" }, "org-x", "user-x", project)).toBe(true);
  });

  it("owner org can access own project", () => {
    expect(
      canAccessProject({ orgLevel: "WOREDA", woredas: ["NonExistent"] }, "org-1", "user-x", project)
    ).toBe(true);
  });

  it("regional user in same region can access", () => {
    expect(
      canAccessProject({ orgLevel: "REGIONAL", regions: ["Oromia"] }, "org-x", "user-x", project)
    ).toBe(true);
  });

  it("regional user in different region cannot access", () => {
    expect(
      canAccessProject({ orgLevel: "REGIONAL", regions: ["Amhara"] }, "org-x", "user-x", project)
    ).toBe(false);
  });

  it("woreda user in same woreda can access", () => {
    expect(
      canAccessProject({ orgLevel: "WOREDA", woredas: ["Bora"] }, "org-x", "user-x", project)
    ).toBe(true);
  });

  it("woreda user in different woreda cannot access", () => {
    expect(
      canAccessProject({ orgLevel: "WOREDA", woredas: ["Kewet"] }, "org-x", "user-x", project)
    ).toBe(false);
  });

  it('creator can access even without matching geography', () => {
    expect(
      canAccessProject({ orgLevel: "REGIONAL", regions: ["Amhara"] }, "org-x", "user-1", project)
    ).toBe(true);
  });

  it("non-creator in a non-matching geography cannot access", () => {
    expect(
      canAccessProject({ orgLevel: "REGIONAL", regions: ["Amhara"] }, "org-x", "user-x", project)
    ).toBe(false);
  });
});
