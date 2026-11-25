import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";
import { HOME_PATH, LOGIN_PATH } from "./route-access";

describe("safeRedirectPath", () => {
  it("keeps same-origin relative paths with query and hash", () => {
    expect(safeRedirectPath("/applications?status=offer#top")).toBe("/applications?status=offer#top");
  });

  it("falls back to / when the value is missing or empty", () => {
    expect(safeRedirectPath(null)).toBe(HOME_PATH);
    expect(safeRedirectPath(undefined)).toBe(HOME_PATH);
    expect(safeRedirectPath("")).toBe(HOME_PATH);
  });

  it("uses a custom fallback", () => {
    expect(safeRedirectPath("https://evil.com", LOGIN_PATH)).toBe(LOGIN_PATH);
  });

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    "evil.com/path",
    "/\t/evil.com",
  ])("rejects %s", (value) => {
    expect(safeRedirectPath(value)).toBe(HOME_PATH);
  });
});
