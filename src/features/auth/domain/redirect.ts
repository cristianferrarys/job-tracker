const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";

/**
 * Returns `value` only when it is a same-origin relative path; otherwise returns `fallback`.
 * Blocks open redirects such as `//evil.com`, `/\evil.com` and absolute URLs.
 */
export function safeRedirectPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  const url = new URL(value, PLACEHOLDER_ORIGIN);
  if (url.origin !== PLACEHOLDER_ORIGIN) {
    return fallback;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
