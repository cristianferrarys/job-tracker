type SkillTagListProps = {
  skills: string[];
  onRemove: (skill: string) => void;
};

/** Skill chips, each with a keyboard-operable remove button. */
export function SkillTagList({ skills, onRemove }: SkillTagListProps) {
  if (skills.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">No skills added yet.</p>;
  }

  return (
    <ul aria-label="Your skills" className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <li
          key={skill}
          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 py-1 pr-1 pl-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100"
        >
          <span className="break-all">{skill}</span>
          <button
            type="button"
            onClick={() => onRemove(skill)}
            aria-label={`Remove ${skill}`}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-base hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 dark:hover:bg-blue-900"
          >
            <span aria-hidden="true">×</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
