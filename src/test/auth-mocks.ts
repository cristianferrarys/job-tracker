import { vi } from "vitest";

/** Thrown by the mocked `redirect()` so tests can assert the destination like Next.js does. */
export class RedirectSignal extends Error {
  constructor(readonly url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}

export function throwRedirect(url: string): never {
  throw new RedirectSignal(url);
}

type AuthErrorLike = { code?: string; message: string } | null;

/** In-memory stand-in for `supabase.auth` with the calls the app uses. */
export function createFakeAuth(options: { user?: { id: string; email?: string } | null } = {}) {
  const user = options.user ?? null;
  return {
    getClaims: vi.fn(async () =>
      user
        ? { data: { claims: { sub: user.id, email: user.email } }, error: null }
        : { data: null, error: null },
    ),
    signInWithPassword: vi.fn(async (): Promise<{ error: AuthErrorLike }> => ({ error: null })),
    signUp: vi.fn(
      async (): Promise<{ data: { session: object | null }; error: AuthErrorLike }> => ({
        data: { session: {} },
        error: null,
      }),
    ),
    signOut: vi.fn(async () => ({ error: null })),
    verifyOtp: vi.fn(async (): Promise<{ error: AuthErrorLike }> => ({ error: null })),
  };
}

export type FakeAuth = ReturnType<typeof createFakeAuth>;
