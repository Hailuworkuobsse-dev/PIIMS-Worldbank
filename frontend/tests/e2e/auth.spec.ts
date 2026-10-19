import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("Authentication", () => {
  test("redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login as MoWE PIU", async ({ page }) => {
    await login(page, "PIU");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Welcome/i)).toBeVisible();
  });

  test("login as World Bank TTL", async ({ page }) => {
    await login(page, "WB");
    await expect(page.getByText(/Portfolio|Welcome/i)).toBeVisible();
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/Username/i).fill("invalid-user");
    await page.getByLabel(/Password/i).fill("wrong-password");
    await page.getByRole("button", { name: /Sign in/i }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 5000 });
  });

  test("language toggle changes UI", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "አማ" }).click();
    await expect(page.getByText(/ይግቡ/)).toBeVisible();
  });

  test("logout returns to login", async ({ page }) => {
    await login(page, "PIU");
    await page.locator('[aria-haspopup="menu"]').last().click();
    await page.getByRole("menuitem", { name: /Sign out/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});