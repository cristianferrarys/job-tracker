import { expect, test } from "@playwright/test";
import { CONFIRMATION_FAILED_CODE } from "@/features/auth/domain/auth-errors";
import { PASSWORD_MIN_LENGTH } from "@/features/auth/domain/credentials";
import { HOME_PATH, LOGIN_PATH, SIGNUP_PATH } from "@/features/auth/domain/route-access";

test.describe("route protection", () => {
  test("redirects an unauthenticated visit to the home page to /login", async ({ page }) => {
    await page.goto(HOME_PATH);

    await expect(page).toHaveURL(LOGIN_PATH);
    await expect(page.getByRole("heading", { level: 1, name: "Log in" })).toBeVisible();
  });

  test("redirects an unauthenticated visit to any protected path to /login", async ({ page }) => {
    await page.goto("/applications");

    await expect(page).toHaveURL(LOGIN_PATH);
  });

  test("redirects an invalid email confirmation link to /login with a friendly error", async ({
    page,
  }) => {
    await page.goto("/auth/confirm?type=signup");

    await expect(page).toHaveURL(`${LOGIN_PATH}?error=${CONFIRMATION_FAILED_CODE}`);
    await expect(
      page.getByRole("alert").filter({ hasText: "invalid or has expired" }),
    ).toBeVisible();
  });
});

test.describe("login page", () => {
  test("renders the form with labeled fields and a link to sign up", async ({ page }) => {
    await page.goto(LOGIN_PATH);

    await expect(page.getByLabel("Email")).toHaveAttribute("autocomplete", "email");
    await expect(page.getByLabel("Password")).toHaveAttribute("autocomplete", "current-password");
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", SIGNUP_PATH);
  });

  test("shows validation errors for an empty submission without navigating", async ({ page }) => {
    await page.goto(LOGIN_PATH);

    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Email is required.")).toBeVisible();
    await expect(page.getByText("Password is required.")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(LOGIN_PATH);
  });

  test("shows a validation error for an invalid email and keeps what was typed", async ({ page }) => {
    await page.goto(LOGIN_PATH);

    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("whatever");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveValue("not-an-email");
    await expect(page).toHaveURL(LOGIN_PATH);
  });
});

test.describe("signup page", () => {
  test("renders the form and links to /login", async ({ page }) => {
    await page.goto(SIGNUP_PATH);

    await expect(page.getByRole("heading", { level: 1, name: "Create your account" })).toBeVisible();
    await expect(page.getByLabel("Email")).toHaveAttribute("autocomplete", "email");
    await expect(page.getByLabel("Password")).toHaveAttribute("autocomplete", "new-password");

    await page.getByRole("link", { name: "Log in" }).click();

    await expect(page).toHaveURL(LOGIN_PATH);
  });

  test("shows the password length rule for a short password without navigating", async ({ page }) => {
    await page.goto(SIGNUP_PATH);

    await page.getByLabel("Email").fill("someone@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)).toBeVisible();
    await expect(page).toHaveURL(SIGNUP_PATH);
  });
});
