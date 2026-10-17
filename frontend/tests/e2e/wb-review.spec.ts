import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("World Bank review", () => {
  test("views portfolio dashboard", async ({ page }) => {
    await login(page, "WB");
    await expect(page.getByText(/Portfolio|Welcome/i)).toBeVisible();
  });

  test("reviews pending inception reports", async ({ page }) => {
    await login(page, "WB");
    await page.goto("/inception");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // If there's a report to review, open it
    const firstRow = page.locator("tbody tr").first();
    if (await firstRow.isVisible()) {
      await firstRow.click();
      await expect(
        page.getByText(/Review|Inception report/i).first(),
      ).toBeVisible();
    }
  });

  test("generates ISR export", async ({ page }) => {
    await login(page, "WB");
    await page.goto("/reports");

    // Look for WB export button
    const wbBtn = page.getByRole("button", { name: /Export WB|ISR/i });
    if (await wbBtn.isVisible()) {
      // Prompt would need to be handled
      page.on("dialog", async (dialog) => {
        await dialog.accept("Q3-2026");
      });
      await wbBtn.click();
    }
  });
});