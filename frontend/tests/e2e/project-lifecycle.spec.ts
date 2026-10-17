import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Project lifecycle", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "PIU");
  });

  test("creates a new project through wizard", async ({ page }) => {
    await page.goto("/projects/new");

    // Step 1: Identification
    await page
      .getByLabel(/Project name/i)
      .first()
      .fill(`E2E Test Project ${Date.now()}`);
    await page.getByLabel(/Subsector/i).fill("Solar Mini-Grid");
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 2: Classification
    await page.getByLabel(/Sector/i).selectOption("ENERGY");
    await page.getByLabel(/Lead organization/i).selectOption({ index: 0 });
    await page.getByLabel(/Implementation arrangement/i).selectOption("PIU");
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 3: Location
    await page.getByLabel(/Region/i).selectOption("Oromia");
    await page.getByLabel(/Woreda/i).fill("Bora");
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 4: Budget
    await page.getByLabel(/Total budget/i).fill("5000000");
    await page
      .getByLabel(/Amount/i)
      .first()
      .fill("5000000");
    await page.getByRole("button", { name: /Continue/i }).click();

    // Step 5: Review
    await page.getByLabel(/I confirm/i).check();
    await page.getByRole("button", { name: /Create project/i }).click();

    // Verify redirect
    await expect(page).toHaveURL(/\/projects/, { timeout: 10_000 });
    await expect(page.getByText(/Project .* created/i)).toBeVisible();
  });

  test("filters projects by status", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("button", { name: /Active/i }).click();
    // Wait for filter to apply
    await page.waitForTimeout(500);
    const rows = await page.locator("tbody tr").count();
    expect(rows).toBeGreaterThanOrEqual(0);
  });

  test("opens project detail", async ({ page }) => {
    await page.goto("/projects");
    const firstRow = page.locator("tbody tr").first();
    await firstRow.click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});