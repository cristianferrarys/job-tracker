import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { applicationIdSchema } from "@/features/applications/domain/application";
import { formatIsoDate } from "@/features/applications/domain/dates";
import { applicationPath, NEW_APPLICATION_PATH } from "@/features/applications/domain/routes";
import { STATUS_LABELS } from "@/features/applications/domain/status";
import { HOME_PATH } from "@/features/auth/domain/route-access";
import {
  applicationCard,
  boardColumn,
  createApplication,
  deleteApplicationsByCompanyPrefix,
  deleteOpenApplication,
  E2E_COMPANY_PREFIXES,
  openBoard,
  waitForInteractiveApplicationForm,
} from "../support/applications";
import { hasE2eCredentials, MISSING_CREDENTIALS_REASON } from "../support/credentials";
import { withSignedInPage } from "../support/signed-in-page";
import { SUPABASE_ROUND_TRIP_TIMEOUT } from "../support/timeouts";

test.skip(!hasE2eCredentials, MISSING_CREDENTIALS_REASON);

const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const application = {
  company: `${E2E_COMPANY_PREFIXES.applications}${runId}`,
  role: "E2E Frontend Developer",
  jobUrl: `https://example.com/jobs/${runId}`,
  jobDescription: "React, TypeScript and accessibility.",
  appliedDate: "2026-11-20",
};
const editedRole = `E2E Staff Engineer ${runId}`;

test.describe("application lifecycle", () => {
  test.describe.configure({ mode: "serial" });

  let detailUrl = "";

  test.afterAll(async ({ browser }, testInfo) => {
    await withSignedInPage(browser, testInfo, (page) =>
      deleteApplicationsByCompanyPrefix(page, E2E_COMPANY_PREFIXES.applications),
    );
  });

  test("creates an application and lands on its detail page", async ({ page }) => {
    detailUrl = await createApplication(page, application);

    const id = new URL(detailUrl).pathname.split("/").pop() ?? "";
    expect(applicationIdSchema.safeParse(id).success).toBe(true);
    expect(new URL(detailUrl).pathname).toBe(applicationPath(id));
    const details = page.getByRole("region", { name: "Details" });
    await expect(details).toContainText(application.role);
    await expect(details).toContainText(formatIsoDate(application.appliedDate));
    const jobLink = details.getByRole("link", { name: new RegExp(`^${application.jobUrl}`) });
    await expect(jobLink).toHaveAttribute("href", application.jobUrl);
    await expect(jobLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("shows the new application in the Applied column of the board", async ({ page }) => {
    await openBoard(page);

    const card = applicationCard(boardColumn(page, "applied"), application.company);
    await expect(card).toContainText(application.role);
    await card.getByRole("link", { name: application.company }).click();

    await expect(page).toHaveURL(detailUrl);
  });

  test("moves the application to Interview from the board", async ({ page }) => {
    await openBoard(page);
    const card = applicationCard(page, application.company);

    await card.getByLabel(/^Status/).selectOption({ label: STATUS_LABELS.interview });
    await card.getByRole("button", { name: /^Move/ }).click();

    await expect(applicationCard(boardColumn(page, "interview"), application.company)).toBeVisible({
      timeout: SUPABASE_ROUND_TRIP_TIMEOUT,
    });
    await expect(applicationCard(boardColumn(page, "applied"), application.company)).toHaveCount(0);
  });

  test("edits the role on the detail page and keeps it after a reload", async ({ page }) => {
    await page.goto(detailUrl);
    const form = page.getByRole("form", { name: "Edit application" });
    await waitForInteractiveApplicationForm(form);

    await form.getByLabel("Role").fill(editedRole);
    await form.getByRole("button", { name: "Save changes" }).click();
    await expect(form.getByRole("status")).toHaveText("Changes saved.", { timeout: SUPABASE_ROUND_TRIP_TIMEOUT });

    await page.reload();

    await expect(form.getByLabel("Role")).toHaveValue(editedRole);
    await expect(page.getByRole("region", { name: "Details" })).toContainText(editedRole);
    await expect(page.getByRole("region", { name: "Details" })).toContainText(STATUS_LABELS.interview);
  });

  test("deletes the application after confirming, and it is gone from the board", async ({ page }) => {
    await page.goto(detailUrl);

    await deleteOpenApplication(page);

    await openBoard(page);
    await expect(page.getByRole("link", { name: application.company })).toHaveCount(0);
    await page.goto(detailUrl);
    await expect(page.getByRole("heading", { level: 1, name: "Application not found" })).toBeVisible();
  });
});

test.describe("new application validation", () => {
  test("shows field errors without saving and keeps what was typed", async ({ page }) => {
    await page.goto(NEW_APPLICATION_PATH);
    const form = page.getByRole("form", { name: "New application" });
    await waitForInteractiveApplicationForm(form);

    await form.getByLabel("Company").fill(application.company);
    await form.getByLabel("Job URL").fill("javascript:alert(1)");
    await form.getByRole("button", { name: "Add application" }).click();

    await expect(form.getByText("Role is required.")).toBeVisible({ timeout: SUPABASE_ROUND_TRIP_TIMEOUT });
    await expect(form.getByLabel("Role")).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByText("Enter a full URL starting with http:// or https://.")).toBeVisible();
    await expect(form.getByLabel("Company")).toHaveValue(application.company);
    await expect(page).toHaveURL(NEW_APPLICATION_PATH);
  });
});

test.describe("application not found", () => {
  test("shows the same not-found page for an unknown id and a malformed id", async ({ page }) => {
    for (const id of [randomUUID(), "not-a-uuid"]) {
      await page.goto(applicationPath(id));

      await expect(page.getByRole("heading", { level: 1, name: "Application not found" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Back to board" })).toHaveAttribute("href", HOME_PATH);
    }
  });
});
