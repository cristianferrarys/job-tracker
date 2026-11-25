import { expect, test, type Browser, type Page, type TestInfo } from "@playwright/test";
import { hasE2eCredentials, MISSING_CREDENTIALS_REASON } from "../support/credentials";
import {
  addSkill,
  openProfileForm,
  profileForm,
  readProfile,
  removeSkill,
  restoreProfile,
  saveProfile,
  summaryField,
  type ProfileSnapshot,
} from "../support/profile-form";

test.skip(!hasE2eCredentials, MISSING_CREDENTIALS_REASON);

/** Every tag these specs add starts with this prefix, so leftovers from failed runs are never kept. */
const E2E_SKILL_PREFIX = "e2e-tag-";
const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const skill = `${E2E_SKILL_PREFIX}${runId}`;
const summary = `E2E summary ${runId}`;

async function withSignedInPage<T>(
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

test.describe("profile editing", () => {
  test.describe.configure({ mode: "serial" });

  // The test account is shared, so the profile found before the run is put back afterwards.
  let original: ProfileSnapshot | undefined;

  test.beforeAll(async ({ browser }, testInfo) => {
    original = await withSignedInPage(browser, testInfo, async (page) => {
      await openProfileForm(page);
      const loaded = await readProfile(page);
      return { ...loaded, skills: loaded.skills.filter((tag) => !tag.startsWith(E2E_SKILL_PREFIX)) };
    });
  });

  test.afterAll(async ({ browser }, testInfo) => {
    const target = original;
    if (target) {
      await withSignedInPage(browser, testInfo, (page) => restoreProfile(page, target));
    }
  });

  test("saves the summary and a new skill, and keeps them after a reload", async ({ page }) => {
    await openProfileForm(page);
    const form = profileForm(page);

    await summaryField(page).fill(summary);
    await expect(summaryField(page)).toHaveValue(summary);
    await addSkill(page, skill);
    await saveProfile(page);

    await page.reload();

    await expect(summaryField(page)).toHaveValue(summary);
    await expect(form.getByRole("list", { name: "Your skills" }).getByText(skill, { exact: true })).toBeVisible();
  });

  test("removes a skill with its Remove button, and keeps it removed after a reload", async ({ page }) => {
    await openProfileForm(page);
    const form = profileForm(page);

    await removeSkill(page, skill);
    await saveProfile(page);

    await page.reload();

    await expect(summaryField(page)).toHaveValue(summary);
    await expect(form.getByRole("button", { name: `Remove ${skill}`, exact: true })).toHaveCount(0);
  });
});
