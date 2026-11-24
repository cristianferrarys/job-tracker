import { expect, test } from "@playwright/test";

test("home page renders without being redirected", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("To get started");
});
