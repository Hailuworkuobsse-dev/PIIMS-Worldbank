import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { login } from "./helpers";

test.describe("Accessibility", () => {
  test("login page passes axe", async ({ page }) => {
    await page.goto("/login");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("dashboard (PIU) passes axe", async ({ page }) => {
    await login(page, "PIU");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("projects list passes axe", async ({ page }) => {
    await login(page, "PIU");
    await page.goto("/projects");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("keyboard navigation works on login", async ({ page }) => {
    await page.goto("/login");
    // Tab through interactive elements
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    // Should reach the username field or language toggle
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(["INPUT", "BUTTON", "A"]).toContain(focused);
  });

  test("language toggle updates html lang", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "አማ" }).click();
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBe("am");
  });
});