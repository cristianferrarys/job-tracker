import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./data/auth-repository";
import { LOGIN_PATH } from "./domain/route-access";
import type { AuthUser } from "./domain/types";

/** Returns the signed-in user or redirects to /login. Use in every protected page. */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(LOGIN_PATH);
  }
  return user;
}
