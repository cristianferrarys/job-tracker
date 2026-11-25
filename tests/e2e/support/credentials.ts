/** Test account used by the signed-in specs. It must already exist and have a confirmed email. */
export type E2eCredentials = { email: string; password: string };

export const MISSING_CREDENTIALS_REASON =
  "Signed-in specs need E2E_EMAIL and E2E_PASSWORD (e.g. in .env.local) for an existing, email-confirmed account.";

function readCredentials(): E2eCredentials | null {
  const email = process.env.E2E_EMAIL?.trim();
  const password = process.env.E2E_PASSWORD;
  return email && password ? { email, password } : null;
}

const credentials = readCredentials();

export const hasE2eCredentials = credentials !== null;

/** Returns the test account. Call it only from specs skipped when `hasE2eCredentials` is false. */
export function requireE2eCredentials(): E2eCredentials {
  if (!credentials) {
    throw new Error(MISSING_CREDENTIALS_REASON);
  }
  return credentials;
}
