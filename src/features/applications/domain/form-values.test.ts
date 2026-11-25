import { describe, expect, it } from "vitest";
import { buildApplication } from "@/test/applications";
import { readApplicationForm, submittedFormValues, toFormValues } from "./form-values";
import { DEFAULT_APPLICATION_STATUS } from "./status";

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  Object.entries(entries).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("readApplicationForm", () => {
  it("reads the application fields only, with null for missing ones", () => {
    expect(readApplicationForm(form({ company: "Acme", role: "Dev", user_id: "attacker" }))).toEqual({
      company: "Acme",
      role: "Dev",
      jobUrl: null,
      jobDescription: null,
      status: null,
      appliedDate: null,
      notes: null,
    });
  });
});

describe("submittedFormValues", () => {
  it("returns the submitted text untouched and empty strings for missing or file fields", () => {
    const data = form({ company: "  Acme ", status: "offer" });
    data.set("notes", new Blob(["x"]));

    expect(submittedFormValues(data)).toEqual({
      company: "  Acme ",
      role: "",
      jobUrl: "",
      jobDescription: "",
      status: "offer",
      appliedDate: "",
      notes: "",
    });
  });
});

describe("toFormValues", () => {
  it("uses the saved values of an application, with empty strings for null fields", () => {
    const application = buildApplication({ jobUrl: null, notes: null, appliedDate: null, status: "offer" });

    expect(toFormValues(application)).toEqual({
      company: application.company,
      role: application.role,
      jobUrl: "",
      jobDescription: application.jobDescription,
      status: "offer",
      appliedDate: "",
      notes: "",
    });
  });

  it("starts a new application empty, with the default status", () => {
    expect(toFormValues(null)).toEqual({
      company: "",
      role: "",
      jobUrl: "",
      jobDescription: "",
      status: DEFAULT_APPLICATION_STATUS,
      appliedDate: "",
      notes: "",
    });
  });
});
