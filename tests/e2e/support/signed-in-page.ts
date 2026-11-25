import type { Browser, Page, TestInfo } from "@playwright/test";

/**
 * Runs `run` on a fresh page with the project's stored session. For `beforeAll` / `afterAll`
 * hooks, which have no `page` fixture.
 */
export async function withSignedInPage<T>(
  browser: Browser,
  testInfo: TestInfo,
  run: (page: Page) => Promise<T>,
): Promise<T> {
  const { baseURL, storageState } = testInfo.project.use;
  const context = await browser.newContext({ baseURL, storageState });
  try {
    return await run(await context.newPage());
  } finally {
    await context.close();
  }
}
