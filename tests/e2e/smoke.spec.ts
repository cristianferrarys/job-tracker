import { expect, test } from "@playwright/test";
import { HOME_PATH, LOGIN_PATH } from "@/features/auth/domain/route-access";

test("app responds and sends signed-out visitors from / to the login page", async ({ page }) => {
  const response = await page.goto(HOME_PATH);

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveURL(LOGIN_PATH);
  await expect(page).toHaveTitle(/Job Tracker/);
});
