import { describe, expect, it } from "vitest";
import { APPLICATION_ID } from "@/test/applications";
import { applicationPath } from "./routes";

describe("applicationPath", () => {
  it("builds the detail path of an application", () => {
    expect(applicationPath(APPLICATION_ID)).toBe(`/applications/${APPLICATION_ID}`);
  });

  it("encodes the id so it stays a single path segment", () => {
    expect(applicationPath("a/../b?c")).toBe("/applications/a%2F..%2Fb%3Fc");
  });
});
