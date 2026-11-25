import type { ReactNode } from "react";

type AlertProps = {
  tone: "error" | "info" | "success";
  children: ReactNode;
};

const TONES = {
  error: "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  info: "border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
  success:
    "border-green-300 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
};

/** Message box; errors are announced immediately, other tones politely. */
export function Alert({ tone, children }: AlertProps) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${TONES[tone]}`}>
      {children}
    </div>
  );
}
