"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { PROFILE_SKILL_MAX_LENGTH, PROFILE_SKILLS_MAX_COUNT } from "../domain/profile";
import { addSkills, removeSkill } from "../domain/skills";
import { SkillTagList } from "./skill-tag-list";

type SkillsInputProps = { defaultSkills: string[]; errors?: string[] };

const INPUT_ID = "field-skillDraft";
const HINT_ID = `${INPUT_ID}-hint`;
const ERROR_ID = `${INPUT_ID}-error`;
const ADD_KEYS = new Set(["Enter", ","]);

/** Tag input: Enter or comma adds the typed skills; each tag is submitted as a `skills` value. */
export function SkillsInput({ defaultSkills, errors }: SkillsInputProps) {
  const [skills, setSkills] = useState(defaultSkills);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const hasErrors = Boolean(errors?.length);

  function commitDraft() {
    setSkills((current) => addSkills(current, draft));
    setDraft("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (ADD_KEYS.has(event.key)) {
      event.preventDefault();
      commitDraft();
    }
  }

  function handleRemove(skill: string) {
    setSkills((current) => removeSkill(current, skill));
    inputRef.current?.focus();
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Skills</legend>
      <SkillTagList skills={skills} onRemove={handleRemove} />
      {skills.map((skill) => (
        <input key={skill} type="hidden" name="skills" value={skill} />
      ))}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={INPUT_ID} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Add skills
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id={INPUT_ID}
            name="skillDraft"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. TypeScript, React"
            autoComplete="off"
            aria-invalid={hasErrors ? true : undefined}
            aria-describedby={hasErrors ? `${HINT_ID} ${ERROR_ID}` : HINT_ID}
            className={`h-11 min-w-0 flex-1 rounded-md border bg-white px-3 text-base text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-offset-zinc-950 ${
              hasErrors ? "border-red-600" : "border-zinc-300 dark:border-zinc-700"
            }`}
          />
          <button
            type="button"
            onClick={commitDraft}
            className="inline-flex h-11 items-center rounded-md border border-zinc-300 bg-white px-4 text-base font-medium text-zinc-900 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Add
          </button>
        </div>
        <p id={HINT_ID} className="text-sm text-zinc-600 dark:text-zinc-400">
          Press Enter or comma to add. {skills.length} / {PROFILE_SKILLS_MAX_COUNT} skills, up to{" "}
          {PROFILE_SKILL_MAX_LENGTH} characters each.
        </p>
        {hasErrors ? (
          <p id={ERROR_ID} className="text-sm text-red-700 dark:text-red-400">
            {errors?.join(" ")}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
