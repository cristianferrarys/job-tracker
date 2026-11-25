import { expect, type Page } from "@playwright/test";
import { HOME_PATH, LOGIN_PATH } from "@/features/auth/domain/route-access";
import type { E2eCredentials } from "./credentials";
import { SUPABASE_ROUND_TRIP_TIMEOUT } from "./timeouts";

/** Logs in through the real login form and waits until the app lands on the home page. */
export async function logIn(page: Page, { email, password }: E2eCredentials): Promise<void> {
  await page.goto(LOGIN_PATH);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(HOME_PATH, { timeout: SUPABASE_ROUND_TRIP_TIMEOUT });
}
