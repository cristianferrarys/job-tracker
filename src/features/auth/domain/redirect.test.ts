import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./redirect";

describe("safeRedirectPath", () => {
  it("keeps same-origin relative paths with query and hash", () => {
    expect(safeRedirectPath("/applications?status=offer#top")).toBe("/applications?status=offer#top");
  });

  it("falls back to / when the value is missing or empty", () => {
    expect(safeRedirectPath(null)).toBe("/");
    expect(safeRedirectPath(undefined)).toBe("/");
    expect(safeRedirectPath("")).toBe("/");
  });

  it("uses a custom fallback", () => {
    expect(safeRedirectPath("https://evil.com", "/login")).toBe("/login");
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
    expect(safeRedirectPath(value)).toBe("/");
  });
});
