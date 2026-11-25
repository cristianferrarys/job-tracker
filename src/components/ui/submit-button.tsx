"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClassName, type ButtonVariant } from "./button-styles";

type SubmitButtonProps = {
  children: ReactNode;
  pendingLabel: string;
  variant?: ButtonVariant;
};

/** Submit button that disables itself and shows `pendingLabel` while its form is submitting. */
export function SubmitButton({ children, pendingLabel, variant = "primary" }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} aria-disabled={pending} className={buttonClassName(variant)}>
      {pending ? pendingLabel : children}
    </button>
  );
}
