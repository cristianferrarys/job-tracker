import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthLink } from "@/features/auth/components/auth-link";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";
import { LoginNotice, type SearchParams } from "@/features/auth/components/login-notice";

export const metadata: Metadata = { title: "Log in · Job Tracker" };

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthShell
      title="Log in"
      description="Track your job applications in one place."
      footer={
        <>
          Don&apos;t have an account? <AuthLink href="/signup">Sign up</AuthLink>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginNotice searchParams={searchParams} />
      </Suspense>
      <LoginForm />
    </AuthShell>
  );
}
