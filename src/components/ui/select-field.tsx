import type { SelectHTMLAttributes } from "react";

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "name" | "children"> & {
  name: string;
  label: string;
  options: readonly { value: string; label: string }[];
  errors?: string[];
};

/** Labeled select that announces its validation errors to assistive technology. */
export function SelectField({ name, label, options, errors, className, ...selectProps }: SelectFieldProps) {
  const id = `field-${name}`;
  const errorId = errors?.length ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
      </label>
      <select
        id={id}
        name={name}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        className={`h-11 rounded-md border bg-white px-3 text-base text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-offset-zinc-950 ${
          errorId ? "border-red-600" : "border-zinc-300 dark:border-zinc-700"
        } ${className ?? ""}`}
        {...selectProps}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errorId ? (
        <p id={errorId} className="text-sm text-red-700 dark:text-red-400">
          {errors?.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
