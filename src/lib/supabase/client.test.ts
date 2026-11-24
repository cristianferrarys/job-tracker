import { createBrowserClient } from "@supabase/ssr";
import { describe, expect, it, vi } from "vitest";
import { createClient } from "./client";

vi.mock("@supabase/ssr", () => ({ createBrowserClient: vi.fn() }));

describe("createClient (browser)", () => {
  it("creates the Supabase browser client with the public env only", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");

    createClient();

    expect(createBrowserClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "public-anon-key",
    );
  });

  it("throws a clear error when the Supabase env is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");

    expect(() => createClient()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
