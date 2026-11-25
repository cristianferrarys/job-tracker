import { expect, test } from "@playwright/test";
import { LOGIN_PATH } from "@/features/auth/domain/route-access";
import { PROFILE_PATH } from "@/features/profile/domain/routes";

test.describe("profile route protection", () => {
  test("redirects an unauthenticated visit to /profile to /login", async ({ page }) => {
    await page.goto(PROFILE_PATH);

    await expect(page).toHaveURL(LOGIN_PATH);
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  });
});
