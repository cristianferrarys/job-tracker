import type { NextRequest } from "next/server";
import { getAuthRedirect } from "@/features/auth/domain/route-access";
import { redirectWithSession, updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await updateSession(request);
  const target = getAuthRedirect(request.nextUrl.pathname, isAuthenticated);
  return target ? redirectWithSession(request, response, target) : response;
}

export const config = {
  matcher: [
    // Every path except static assets, image optimization and metadata/image files.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
