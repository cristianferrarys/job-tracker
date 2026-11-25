import type { TextareaHTMLAttributes } from "react";

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id" | "name"> & {
  name: string;
  label: string;
  hint?: string;
  errors?: string[];
};

/** Labeled textarea that announces its hint and validation errors to assistive technology. */
export function TextAreaField({ name, label, hint, errors, className, ...textareaProps }: TextAreaFieldProps) {
  const id = `field-${name}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = errors?.length ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-40 rounded-md border bg-white px-3 py-2 text-base text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-offset-zinc-950 ${
          errorId ? "border-red-600" : "border-zinc-300 dark:border-zinc-700"
        } ${className ?? ""}`}
        {...textareaProps}
      />
      {hint ? (
        <p id={hintId} className="text-sm text-zinc-600 dark:text-zinc-400">
          {hint}
        </p>
      ) : null}
      {errorId ? (
        <p id={errorId} className="text-sm text-red-700 dark:text-red-400">
          {errors?.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
