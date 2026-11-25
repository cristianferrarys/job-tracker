import { expect, test } from "@playwright/test";
import { NEW_APPLICATION_PATH } from "@/features/applications/domain/routes";
import { HOME_PATH, LOGIN_PATH } from "@/features/auth/domain/route-access";
import { PROFILE_PATH } from "@/features/profile/domain/routes";
import { hasE2eCredentials, MISSING_CREDENTIALS_REASON, requireE2eCredentials } from "../support/credentials";

test.skip(!hasE2eCredentials, MISSING_CREDENTIALS_REASON);

test.describe("board page when signed in", () => {
  test("shows the signed-in account", async ({ page }) => {
    const { email } = requireE2eCredentials();

    await page.goto(HOME_PATH);

    await expect(page.getByRole("region", { name: "Account" })).toContainText(`Signed in as ${email}`, {
      ignoreCase: true,
    });
  });

  test("shows the header navigation and the sign-out button", async ({ page }) => {
    await page.goto(HOME_PATH);

    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Board" })).toHaveAttribute("href", HOME_PATH);
    await expect(nav.getByRole("link", { name: "Board" })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("link", { name: "New application" })).toHaveAttribute("href", NEW_APPLICATION_PATH);
    await expect(nav.getByRole("link", { name: "Profile" })).toHaveAttribute("href", PROFILE_PATH);
    await expect(page.getByRole("banner").getByRole("button", { name: "Sign out" })).toBeVisible();
  });

  test("navigates to the new-application page from the header", async ({ page }) => {
    await page.goto(HOME_PATH);

    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "New application" }).click();

    await expect(page).toHaveURL(NEW_APPLICATION_PATH);
    await expect(page.getByRole("heading", { level: 1, name: "New application" })).toBeVisible();
  });

  test("navigates to the profile page from the header", async ({ page }) => {
    await page.goto(HOME_PATH);

    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Profile" }).click();

    await expect(page).toHaveURL(PROFILE_PATH);
    await expect(page.getByRole("heading", { level: 1, name: "Your profile" })).toBeVisible();
  });

  test("redirects a visit to the login page back to home", async ({ page }) => {
    await page.goto(LOGIN_PATH);

    await expect(page).toHaveURL(HOME_PATH);
  });
});
