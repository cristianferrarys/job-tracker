import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, expectTypeOf, it } from "vitest";
import { Constants, type Database } from "./database.types";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");
const OWNER_CHECK = "(select auth.uid()) = user_id";
const COMMANDS = ["select", "insert", "update", "delete"] as const;

type Policy = {
  table: string;
  command: string;
  roles: string;
  using: string | null;
  withCheck: string | null;
};

/** All migrations as one normalized SQL string: no comments, single spaces, lowercase. */
function loadSchemaSql(): string {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(join(MIGRATIONS_DIR, file), "utf8"))
    .join("\n")
    .replace(/--[^\n]*/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

/** Top-level statements; dollar-quoted bodies are blanked so their semicolons do not split. */
function statements(sql: string): string[] {
  return sql
    .replace(/\$\$.*?\$\$/g, "$$$$")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function tableNames(sql: string): string[] {
  return [...sql.matchAll(/create table (?:if not exists )?public\.(\w+)/g)].map((m) => m[1]);
}

function tableBody(sql: string, table: string): string {
  const match = sql.match(new RegExp(`create table (?:if not exists )?public\\.${table} \\((.*?)\\);`));
  return match?.[1] ?? "";
}

/** Extracts a parenthesized expression that follows `keyword (` in a statement. */
function clause(statement: string, keyword: string): string | null {
  const start = statement.indexOf(`${keyword} (`);
  if (start === -1) return null;
  let depth = 0;
  const open = start + keyword.length + 1;
  for (let i = open; i < statement.length; i++) {
    if (statement[i] === "(") depth++;
    if (statement[i] === ")") depth--;
    if (depth === 0) return statement.slice(open + 1, i).trim();
  }
  return null;
}

function policies(sql: string): Policy[] {
  return statements(sql)
    .filter((statement) => statement.startsWith("create policy"))
    .map((statement) => {
      const head = statement.match(/^create policy "?[\w ]+"? on public\.(\w+) for (\w+) to ([\w, ]+?) (?:using|with check)/);
      return {
        table: head?.[1] ?? "",
        command: head?.[2] ?? "",
        roles: head?.[3] ?? "",
        using: clause(statement, "using"),
        withCheck: clause(statement, "with check"),
      };
    });
}

function enumValues(sql: string, name: string): string[] {
  const match = sql.match(new RegExp(`create type public\\.${name} as enum \\(([^)]*)\\)`));
  return [...(match?.[1] ?? "").matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const sql = loadSchemaSql();
const tables = tableNames(sql);
const allPolicies = policies(sql);

describe("database schema security contract", () => {
  it("creates the MVP tables, matching the TypeScript Database type", () => {
    expect([...tables].sort()).toEqual(["application_analyses", "applications", "profiles"]);
    expectTypeOf<keyof Database["public"]["Tables"]>().toEqualTypeOf<
      "profiles" | "applications" | "application_analyses"
    >();
  });

  it.each(tables)("%s is owned by a user and removed with that user", (table) => {
    expect(tableBody(sql, table)).toMatch(
      /user_id uuid (?:not null|primary key) references auth\.users \(id\) on delete cascade/,
    );
  });

  it.each(tables)("%s has row level security enabled", (table) => {
    expect(sql).toContain(`alter table public.${table} enable row level security`);
  });

  describe.each(tables)("%s policies", (table) => {
    const tablePolicies = allPolicies.filter((policy) => policy.table === table);

    it("defines exactly one policy per command", () => {
      expect(tablePolicies.map((policy) => policy.command).sort()).toEqual([...COMMANDS].sort());
    });

    it("grants access only to authenticated users", () => {
      expect(tablePolicies.every((policy) => policy.roles === "authenticated")).toBe(true);
    });

    it.each(["select", "delete"])("%s only sees the owner's rows", (command) => {
      const policy = tablePolicies.find((p) => p.command === command);
      expect(policy?.using).toBe(OWNER_CHECK);
      expect(policy?.withCheck).toBeNull();
    });

    it("insert only accepts rows owned by the caller", () => {
      const policy = tablePolicies.find((p) => p.command === "insert");
      expect(policy?.withCheck).toBe(OWNER_CHECK);
    });

    it("update can neither read nor reassign other users' rows", () => {
      const policy = tablePolicies.find((p) => p.command === "update");
      expect(policy?.using).toBe(OWNER_CHECK);
      expect(policy?.withCheck).toBe(OWNER_CHECK);
    });
  });

  it("never grants a policy to anonymous visitors", () => {
    expect(allPolicies.some((policy) => /\b(anon|public)\b/.test(policy.roles))).toBe(false);
  });

  it("restricts application status to the domain values", () => {
    expect(enumValues(sql, "application_status")).toEqual([
      ...Constants.public.Enums.application_status,
    ]);
    expect(Constants.public.Enums.application_status).toEqual([
      "applied",
      "interview",
      "offer",
      "rejected",
    ]);
  });
});
