import { describe, it, expect } from "vitest";
import { MENU, BREADCRUMBS } from "../menu.config";

describe("menu.config", () => {
  it("every top-level item has an id, label, and path", () => {
    for (const item of MENU) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.to).toMatch(/^\//);
    }
  });

  it("every child route starts with parent path", () => {
    for (const item of MENU) {
      for (const c of item.children ?? []) {
        expect(c.to.startsWith(item.to === "/" ? "/" : item.to)).toBe(true);
      }
    }
  });

  it("breadcrumb dictionary has entries for main paths", () => {
    for (const key of ["dashboard", "projects", "impact", "reports", "admin"]) {
      expect(BREADCRUMBS[key]).toBeTruthy();
    }
  });
});