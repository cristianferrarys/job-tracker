import type { Metadata } from "next";
import { AuthLink } from "@/features/auth/components/auth-link";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignupForm } from "@/features/auth/components/signup-form";

export const metadata: Metadata = { title: "Sign up · Job Tracker" };

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Sign up with your email and a password."
      footer={
        <>
          Already have an account? <AuthLink href="/login">Log in</AuthLink>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
