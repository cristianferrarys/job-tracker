import { describe, expect, it } from "vitest";
import { getAuthRedirect, HOME_PATH, isPublicPath, LOGIN_PATH, SIGNUP_PATH } from "./route-access";

describe("isPublicPath", () => {
  it.each([LOGIN_PATH, SIGNUP_PATH, "/auth", "/auth/confirm"])("treats %s as public", (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it.each([HOME_PATH, "/applications", "/loginx", "/authors", "/signup/extra"])(
    "treats %s as protected",
    (path) => {
      expect(isPublicPath(path)).toBe(false);
    },
  );
});

describe("getAuthRedirect", () => {
  it("sends signed-out users on protected paths to /login", () => {
    expect(getAuthRedirect(HOME_PATH, false)).toBe(LOGIN_PATH);
    expect(getAuthRedirect("/applications/42", false)).toBe(LOGIN_PATH);
  });

  it("lets signed-out users reach public paths", () => {
    expect(getAuthRedirect(LOGIN_PATH, false)).toBeNull();
    expect(getAuthRedirect(SIGNUP_PATH, false)).toBeNull();
    expect(getAuthRedirect("/auth/confirm", false)).toBeNull();
  });

  it("sends signed-in users away from /login and /signup to /", () => {
    expect(getAuthRedirect(LOGIN_PATH, true)).toBe(HOME_PATH);
    expect(getAuthRedirect(SIGNUP_PATH, true)).toBe(HOME_PATH);
  });

  it("lets signed-in users reach protected paths and the auth callback", () => {
    expect(getAuthRedirect(HOME_PATH, true)).toBeNull();
    expect(getAuthRedirect("/applications", true)).toBeNull();
    expect(getAuthRedirect("/auth/confirm", true)).toBeNull();
  });
});
