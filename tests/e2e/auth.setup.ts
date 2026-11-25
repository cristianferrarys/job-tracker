import { test as setup } from "@playwright/test";
import { AUTH_STATE_PATH } from "./support/auth-state";
import { hasE2eCredentials, MISSING_CREDENTIALS_REASON, requireE2eCredentials } from "./support/credentials";
import { logIn } from "./support/log-in";

setup.skip(!hasE2eCredentials, MISSING_CREDENTIALS_REASON);

setup("log in through the login page and store the session", async ({ page }) => {
  await logIn(page, requireE2eCredentials());

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
