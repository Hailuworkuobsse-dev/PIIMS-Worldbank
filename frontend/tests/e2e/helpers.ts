import { Page, expect } from "@playwright/test";

export const ROLES = {
  PIU: { username: "mowe.piu01", password: "demo1234" },
  WB: { username: "wb.ttl01", password: "demo1234" },
  IE: { username: "mowe.ie01", password: "demo1234" },
  DC: { username: "dc.en01", password: "demo1234" },
  QA: { username: "mowe.qa01", password: "demo1234" },
  ADMIN: { username: "mowe.admin", password: "demo1234" },
} as const;

export async function login(page: Page, role: keyof typeof ROLES) {
  await page.goto("/login");
  await page.getByLabel(/Username/i).fill(ROLES[role].username);
  await page.getByLabel(/Password/i).fill(ROLES[role].password);
  await page.getByRole("button", { name: /Sign in/i }).click();
  // Wait for dashboard or redirect
  await expect(page).not.toHaveURL(/\/login/);
}

export async function switchRole(page: Page, role: string) {
  const btn = page.locator("[data-role]").filter({ hasText: role });
  if (await btn.isVisible()) await btn.click();
}

export async function waitForToast(page: Page, text: RegExp) {
  await expect(page.getByText(text)).toBeVisible({ timeout: 5000 });
}