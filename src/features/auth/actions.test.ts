import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createFakeAuth, RedirectSignal, throwRedirect, type FakeAuth } from "@/test/auth-mocks";
import { signIn, signOut, signUp } from "./actions";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(throwRedirect) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

let auth: FakeAuth;

function useAuth(fake: FakeAuth) {
  auth = fake;
  vi.mocked(createClient).mockResolvedValue({ auth } as unknown as Awaited<ReturnType<typeof createClient>>);
}

function form(fields: Record<string, string>) {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
}

async function redirectTarget(promise: Promise<unknown>): Promise<string> {
  const error = await promise.then(
    () => null,
    (reason: unknown) => reason,
  );
  if (!(error instanceof RedirectSignal)) {
    throw new Error("Expected a redirect");
  }
  return error.url;
}

beforeEach(() => {
  useAuth(createFakeAuth());
});

describe("signIn", () => {
  it("signs in an unauthenticated user with normalized credentials and redirects to /", async () => {
    const target = await redirectTarget(
      signIn(null, form({ email: " Ana@Example.com ", password: "secret-pass" })),
    );

    expect(target).toBe("/");
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "secret-pass",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it("returns field errors and does not call Supabase for invalid input", async () => {
    const result = await signIn(null, form({ email: "nope", password: "" }));

    expect(result).toEqual({
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: { email: ["Enter a valid email address."], password: ["Password is required."] },
      email: "nope",
    });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("returns field errors when the fields are missing", async () => {
    const result = await signIn(null, new FormData());

    expect(result?.ok).toBe(false);
    expect(result?.fieldErrors).toEqual({
      email: ["Email is required."],
      password: ["Password is required."],
    });
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("returns a generic error that does not reveal whether the email exists", async () => {
    auth.signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials", message: "Invalid login credentials" },
    });

    const result = await signIn(null, form({ email: "ana@example.com", password: "wrong-pass" }));

    expect(result).toEqual({ ok: false, error: "Invalid email or password.", email: "ana@example.com" });
  });

  it("redirects an already signed-in user to / without signing in again", async () => {
    useAuth(createFakeAuth({ user: { id: "user-1", email: "ana@example.com" } }));

    const target = await redirectTarget(
      signIn(null, form({ email: "ana@example.com", password: "secret-pass" })),
    );

    expect(target).toBe("/");
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("signUp", () => {
  it("redirects to / when Supabase returns a session", async () => {
    const target = await redirectTarget(
      signUp(null, form({ email: "New@Example.com", password: "12345678" })),
    );

    expect(target).toBe("/");
    expect(auth.signUp).toHaveBeenCalledWith({ email: "new@example.com", password: "12345678" });
  });

  it("asks the user to confirm the email when Supabase returns no session", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null });

    const result = await signUp(null, form({ email: "new@example.com", password: "12345678" }));

    expect(result).toEqual({
      ok: true,
      data: { status: "confirmation_required", email: "new@example.com" },
    });
  });

  it("returns field errors and does not call Supabase for a short password", async () => {
    const result = await signUp(null, form({ email: "new@example.com", password: "short" }));

    expect(result).toEqual({
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: { password: ["Password must be at least 8 characters."] },
      email: "new@example.com",
    });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("maps a Supabase error to a friendly message", async () => {
    auth.signUp.mockResolvedValue({
      data: { session: null },
      error: { code: "weak_password", message: "Password is known to be weak" },
    });

    const result = await signUp(null, form({ email: "new@example.com", password: "password" }));

    expect(result).toEqual({
      ok: false,
      error: "This password is too weak. Choose a longer, less common password.",
      email: "new@example.com",
    });
  });

  it("falls back to a generic message when Supabase gives no error code", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null }, error: { message: "fetch failed" } });

    const result = await signUp(null, form({ email: "new@example.com", password: "12345678" }));

    expect(result).toMatchObject({ ok: false, error: "We could not create your account. Please try again." });
  });

  it("redirects an already signed-in user to / without creating an account", async () => {
    useAuth(createFakeAuth({ user: { id: "user-1", email: "ana@example.com" } }));

    const target = await redirectTarget(
      signUp(null, form({ email: "new@example.com", password: "12345678" })),
    );

    expect(target).toBe("/");
    expect(auth.signUp).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  it("signs out the current user and redirects to /login", async () => {
    useAuth(createFakeAuth({ user: { id: "user-1", email: "ana@example.com" } }));

    const target = await redirectTarget(signOut());

    expect(target).toBe("/login");
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("still ends at /login when nobody is signed in", async () => {
    const target = await redirectTarget(signOut());

    expect(target).toBe("/login");
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});
