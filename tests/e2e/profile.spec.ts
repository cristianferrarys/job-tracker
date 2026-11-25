import { expect, test } from "@playwright/test";

test.describe("profile route protection", () => {
  test("redirects an unauthenticated visit to /profile to /login", async ({ page }) => {
    await page.goto("/profile");

    await expect(page).toHaveURL("/login");
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  });
});
