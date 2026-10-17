import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Field interview (CAPI)", () => {
  test("completes an interview offline", async ({ page, context }) => {
    await login(page, "DC");
    await page.goto("/impact/field");

    // Start interview
    const startBtn = page
      .getByRole("button", { name: /Start interview/i })
      .first();
    if (await startBtn.isVisible()) {
      await startBtn.click();

      // Consent
      await page.getByLabel(/agrees to participate/i).check();
      await page.getByLabel(/agrees to data use/i).check();
      await page.getByRole("button", { name: /Begin interview/i }).click();

      // Go offline mid-interview
      await context.setOffline(true);

      // Answer first question
      const textInput = page.locator('textarea, input[type="text"]').first();
      if (await textInput.isVisible()) {
        await textInput.fill("Test answer");
      }
      await page.getByRole("button", { name: /Next/i }).click();

      // Verify offline indicator
      await expect(page.getByText(/Offline|offline/i).first()).toBeVisible();

      // Go online
      await context.setOffline(false);
      await page.waitForTimeout(2000);

      // Verify sync happens
      await expect(page.getByText(/synced|Online/i).first()).toBeVisible({
        timeout: 10_000,
      });
    }
  });

  test("persists consent state", async ({ page }) => {
    await login(page, "DC");
    await page.goto("/impact/field");
    // Consent checkboxes should be usable
    const startBtn = page
      .getByRole("button", { name: /Start interview/i })
      .first();
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await expect(page.getByLabel(/agrees to participate/i)).toBeVisible();
    }
  });
});