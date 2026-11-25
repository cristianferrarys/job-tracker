import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { applicationPath, NEW_APPLICATION_PATH } from "@/features/applications/domain/routes";
import { LOGIN_PATH } from "@/features/auth/domain/route-access";

test.describe("applications route protection", () => {
  test("redirects an unauthenticated visit to the new-application page to /login", async ({ page }) => {
    await page.goto(NEW_APPLICATION_PATH);

    await expect(page).toHaveURL(LOGIN_PATH);
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  });

  test("redirects an unauthenticated visit to an application detail page to /login", async ({ page }) => {
    await page.goto(applicationPath(randomUUID()));

    await expect(page).toHaveURL(LOGIN_PATH);
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  });
});
