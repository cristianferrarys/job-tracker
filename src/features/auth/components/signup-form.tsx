"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { signUp } from "../actions";
import { PASSWORD_MIN_LENGTH } from "../domain/credentials";
import { SignupConfirmation } from "./signup-confirmation";

export function SignupForm() {
  const [state, formAction] = useActionState(signUp, null);

  if (state?.ok) {
    return <SignupConfirmation email={state.data.email} />;
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4" aria-label="Sign up">
      {state ? <Alert tone="error">{state.error}</Alert> : null}
      <TextField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state?.email}
        errors={state?.fieldErrors?.email}
      />
      <TextField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
        errors={state?.fieldErrors?.password}
      />
      <SubmitButton pendingLabel="Creating account…">Create account</SubmitButton>
    </form>
  );
}
