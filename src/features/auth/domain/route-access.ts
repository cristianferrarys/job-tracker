export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const HOME_PATH = "/";

const AUTH_PAGES = new Set([LOGIN_PATH, SIGNUP_PATH]);
const AUTH_CALLBACK_PREFIX = "/auth";

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Login and signup pages: only for signed-out users. */
export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.has(pathname);
}

/** Paths reachable without a session. Everything else requires one. */
export function isPublicPath(pathname: string): boolean {
  return isAuthPage(pathname) || matchesPrefix(pathname, AUTH_CALLBACK_PREFIX);
}

/** Decides where a request must be redirected based on the session, or `null` to let it through. */
export function getAuthRedirect(pathname: string, isAuthenticated: boolean): string | null {
  if (isAuthenticated) {
    return isAuthPage(pathname) ? HOME_PATH : null;
  }
  return isPublicPath(pathname) ? null : LOGIN_PATH;
}
