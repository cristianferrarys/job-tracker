import { describe, expect, it } from "vitest";
import { getAuthRedirect, isPublicPath } from "./route-access";

describe("isPublicPath", () => {
  it.each(["/login", "/signup", "/auth", "/auth/confirm"])("treats %s as public", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each(["/", "/applications", "/loginx", "/authors", "/signup/extra"])(
    "treats %s as protected",
    (path) => {
      expect(isPublicPath(path)).toBe(false);
    },
  );
});

describe("getAuthRedirect", () => {
  it("sends signed-out users on protected paths to /login", () => {
    expect(getAuthRedirect("/", false)).toBe("/login");
    expect(getAuthRedirect("/applications/42", false)).toBe("/login");
  });

  it("lets signed-out users reach public paths", () => {
    expect(getAuthRedirect("/login", false)).toBeNull();
    expect(getAuthRedirect("/signup", false)).toBeNull();
    expect(getAuthRedirect("/auth/confirm", false)).toBeNull();
  });

  it("sends signed-in users away from /login and /signup to /", () => {
    expect(getAuthRedirect("/login", true)).toBe("/");
    expect(getAuthRedirect("/signup", true)).toBe("/");
  });

  it("lets signed-in users reach protected paths and the auth callback", () => {
    expect(getAuthRedirect("/", true)).toBeNull();
    expect(getAuthRedirect("/applications", true)).toBeNull();
    expect(getAuthRedirect("/auth/confirm", true)).toBeNull();
  });
});
