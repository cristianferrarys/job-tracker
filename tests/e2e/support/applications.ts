import { expect, type Locator, type Page } from "@playwright/test";
import { JOB_DESCRIPTION_MAX_LENGTH } from "@/features/applications/domain/application";
import { NEW_APPLICATION_PATH } from "@/features/applications/domain/routes";
import { STATUS_LABELS, type ApplicationStatus } from "@/features/applications/domain/status";
import { HOME_PATH } from "@/features/auth/domain/route-access";
import { SUPABASE_ROUND_TRIP_TIMEOUT } from "./timeouts";

export type NewApplication = {
  company: string;
  role: string;
  jobUrl: string;
  jobDescription: string;
  appliedDate: string;
};

export function boardColumn(page: Page, status: ApplicationStatus): Locator {
  return page.getByRole("region", { name: STATUS_LABELS[status], exact: true });
}

export function applicationCard(scope: Page | Locator, company: string): Locator {
  return scope.getByRole("article", { name: company, exact: true });
}

function descriptionField(form: Locator): Locator {
  return form.getByLabel("Job description", { exact: true });
}

function descriptionHint(description: string): RegExp {
  return new RegExp(`^${description.length} / ${JOB_DESCRIPTION_MAX_LENGTH} characters\\.`);
}

/**
 * Waits until `form` is hydrated: the job description count only follows typing once React runs.
 * The probe always differs in length from the loaded text, which is put back afterwards.
 */
export async function waitForInteractiveApplicationForm(form: Locator): Promise<void> {
  const field = descriptionField(form);
  const loaded = await field.inputValue();
  const probe = loaded === "" ? "x" : "";
  await expect(async () => {
    await field.fill(probe);
    await expect(field).toHaveAccessibleDescription(descriptionHint(probe), { timeout: 1_000 });
  }).toPass();
  await field.fill(loaded);
  await expect(field).toHaveAccessibleDescription(descriptionHint(loaded));
}

/** Opens the board and waits until it shows either its columns or its empty state. */
export async function openBoard(page: Page): Promise<void> {
  await page.goto(HOME_PATH);
  await expect(
    boardColumn(page, "applied").or(page.getByRole("heading", { name: "No applications yet" })),
  ).toBeVisible({ timeout: SUPABASE_ROUND_TRIP_TIMEOUT });
}

/** Creates an application through the form and waits for its detail page. Returns its URL. */
export async function createApplication(page: Page, application: NewApplication): Promise<string> {
  await page.goto(NEW_APPLICATION_PATH);
  const form = page.getByRole("form", { name: "New application" });
  await waitForInteractiveApplicationForm(form);
  await form.getByLabel("Company").fill(application.company);
  await form.getByLabel("Role").fill(application.role);
  await form.getByLabel("Job URL").fill(application.jobUrl);
  await descriptionField(form).fill(application.jobDescription);
  await form.getByLabel("Applied date").fill(application.appliedDate);
  await form.getByRole("button", { name: "Add application" }).click();
  await expect(page.getByRole("heading", { level: 1, name: application.company })).toBeVisible({
    timeout: SUPABASE_ROUND_TRIP_TIMEOUT,
  });
  return page.url();
}

/** Deletes the application whose detail page is open, confirming in the dialog. */
export async function deleteOpenApplication(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog", { name: "Delete this application?" });
  await expect(async () => {
    await page.getByRole("button", { name: "Delete application" }).click();
    await expect(dialog).toBeVisible({ timeout: 1_000 });
  }).toPass();
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page).toHaveURL(HOME_PATH, { timeout: SUPABASE_ROUND_TRIP_TIMEOUT });
}

/** Deletes every application whose company starts with `prefix` (leftovers of failed runs). */
export async function deleteApplicationsByCompanyPrefix(page: Page, prefix: string): Promise<void> {
  await openBoard(page);
  const hrefs = await page
    .getByRole("article")
    .getByRole("link")
    .evaluateAll(
      (links, start) =>
        links.filter((link) => link.textContent?.startsWith(start)).map((link) => link.getAttribute("href") ?? ""),
      prefix,
    );
  for (const href of new Set(hrefs)) {
    await page.goto(href);
    await deleteOpenApplication(page);
  }
}
