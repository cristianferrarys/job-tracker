const SKILL_SEPARATOR = ",";

/** Trims a skill tag and collapses runs of whitespace into a single space. */
export function normalizeSkill(skill: string): string {
  return skill.trim().replace(/\s+/g, " ");
}

/** Normalizes tags, drops empty ones and removes case-insensitive duplicates (first one wins). */
export function normalizeSkills(skills: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const skill of skills.map(normalizeSkill)) {
    const key = skill.toLowerCase();
    if (skill && !seen.has(key)) {
      seen.add(key);
      result.push(skill);
    }
  }
  return result;
}

/** Turns a comma-separated input such as "TypeScript, React" into normalized tags. */
export function parseSkillInput(input: string): string[] {
  return normalizeSkills(input.split(SKILL_SEPARATOR));
}

/** Adds the tags typed in `input` to `current`, skipping ones that already exist. */
export function addSkills(current: readonly string[], input: string): string[] {
  return normalizeSkills([...current, ...parseSkillInput(input)]);
}

export function removeSkill(current: readonly string[], skill: string): string[] {
  return current.filter((existing) => existing !== skill);
}
