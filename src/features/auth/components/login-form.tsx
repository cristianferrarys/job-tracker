"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { TextField } from "@/components/ui/text-field";
import { signIn } from "../actions";

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, null);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4" aria-label="Log in">
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
        autoComplete="current-password"
        required
        errors={state?.fieldErrors?.password}
      />
      <SubmitButton pendingLabel="Logging in…">Log in</SubmitButton>
    </form>
  );
}
