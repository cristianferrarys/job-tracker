import { expect, test } from "@playwright/test";

test("app responds and sends signed-out visitors from / to the login page", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveURL("/login");
  await expect(page).toHaveTitle(/Job Tracker/);
});
