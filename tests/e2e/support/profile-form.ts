import { expect, type Locator, type Page } from "@playwright/test";
import { PROFILE_SUMMARY_MAX_LENGTH } from "@/features/profile/domain/profile";
import { PROFILE_PATH } from "@/features/profile/domain/routes";
import { SUPABASE_ROUND_TRIP_TIMEOUT } from "./timeouts";

/** The editable values of the profile form. */
export type ProfileSnapshot = { summary: string; skills: string[] };

export function profileForm(page: Page): Locator {
  return page.getByRole("form", { name: "Profile" });
}

export function summaryField(page: Page): Locator {
  return profileForm(page).getByLabel("Summary", { exact: true });
}

function removeSkillButton(page: Page, skill: string): Locator {
  return profileForm(page).getByRole("button", { name: `Remove ${skill}`, exact: true });
}

function summaryHint(summary: string): RegExp {
  return new RegExp(`^${summary.length} / ${PROFILE_SUMMARY_MAX_LENGTH} characters\\.`);
}

/** Fills the summary and waits until React state (shown by the live character count) holds it. */
export async function fillSummary(page: Page, summary: string): Promise<void> {
  const field = summaryField(page);
  await field.fill(summary);
  await expect(field).toHaveValue(summary);
  await expect(field).toHaveAccessibleDescription(summaryHint(summary));
}

/**
 * Waits until the profile form is hydrated. The character count only reacts to typing once React
 * is attached, so the probe value (always a different length than the server-rendered one) is
 * retried until the count follows it. The summary is then put back to its loaded value.
 */
export async function waitForInteractiveProfileForm(page: Page): Promise<void> {
  const field = summaryField(page);
  const loaded = await field.inputValue();
  const probe = loaded === "" ? "x" : "";
  await expect(async () => {
    await field.fill(probe);
    await expect(field).toHaveAccessibleDescription(summaryHint(probe), { timeout: 1_000 });
  }).toPass();
  await fillSummary(page, loaded);
}

/** Opens the profile page and waits until the form accepts input. */
export async function openProfileForm(page: Page): Promise<void> {
  await page.goto(PROFILE_PATH);
  await waitForInteractiveProfileForm(page);
}

export async function saveProfile(page: Page): Promise<void> {
  const form = profileForm(page);
  await form.getByRole("button", { name: "Save profile" }).click();
  await expect(form.getByRole("status")).toHaveText("Profile saved.", { timeout: SUPABASE_ROUND_TRIP_TIMEOUT });
}

export async function addSkill(page: Page, skill: string): Promise<void> {
  const input = profileForm(page).getByLabel("Add skills");
  await input.fill(skill);
  await input.press("Enter");
  await expect(removeSkillButton(page, skill)).toBeVisible();
}

export async function removeSkill(page: Page, skill: string): Promise<void> {
  await removeSkillButton(page, skill).click();
  await expect(removeSkillButton(page, skill)).toHaveCount(0);
}

/** Reads the values the form would submit; works before hydration (server-rendered). */
export async function readProfile(page: Page): Promise<ProfileSnapshot> {
  const form = profileForm(page);
  const summary = await summaryField(page).inputValue();
  const skills = await form
    .locator('input[type="hidden"][name="skills"]')
    .evaluateAll((inputs) => inputs.map((input) => (input instanceof HTMLInputElement ? input.value : "")));
  return { summary, skills };
}

/** Puts the profile back to `target`, saving only when something differs. */
export async function restoreProfile(page: Page, target: ProfileSnapshot): Promise<void> {
  await openProfileForm(page);
  const current = await readProfile(page);
  const extra = current.skills.filter((skill) => !target.skills.includes(skill));
  const missing = target.skills.filter((skill) => !current.skills.includes(skill));
  if (current.summary === target.summary && extra.length === 0 && missing.length === 0) {
    return;
  }
  await fillSummary(page, target.summary);
  for (const skill of extra) {
    await removeSkill(page, skill);
  }
  for (const skill of missing) {
    await addSkill(page, skill);
  }
  await saveProfile(page);
}
