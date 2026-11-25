import { expect, test } from "@playwright/test";
import { HOME_PATH, LOGIN_PATH } from "@/features/auth/domain/route-access";
import { hasE2eCredentials, MISSING_CREDENTIALS_REASON, requireE2eCredentials } from "./support/credentials";
import { logIn } from "./support/log-in";
import { SUPABASE_ROUND_TRIP_TIMEOUT } from "./support/timeouts";

test.skip(!hasE2eCredentials, MISSING_CREDENTIALS_REASON);

// Uses its own fresh login, never the stored session. Sign-out ends only this browser's session,
// so it can run in parallel with the signed-in specs that share the stored one.
test("signing out returns to the login page and protects the app again", async ({ page }) => {
  await logIn(page, requireE2eCredentials());

  await page.getByRole("banner").getByRole("button", { name: "Sign out" }).click();

  await expect(page).toHaveURL(LOGIN_PATH, { timeout: SUPABASE_ROUND_TRIP_TIMEOUT });
  await page.goto(HOME_PATH);
  await expect(page).toHaveURL(LOGIN_PATH);
});
