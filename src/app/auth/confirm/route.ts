import type { NextRequest } from "next/server";
import { handleEmailConfirmation } from "@/features/auth/confirm-email";

export async function GET(request: NextRequest) {
  return handleEmailConfirmation(request);
}
