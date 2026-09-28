import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { UserDto } from "@/src/lib/student-api/contract";
import { authenticatedBackendFetch, getAccessToken, getRefreshToken } from "@/src/lib/student-api/session";

export async function GET() {
  // Logged out = no access AND no refresh cookie. An expired access cookie with a
  // live refresh cookie must still reach the backend call below, which refreshes it.
  if (!(await getAccessToken()) && !(await getRefreshToken())) return Response.json({ user: null });
  const result = await authenticatedBackendFetch<UserDto>("/api/v1/auth/me", {
    cache: "no-store",
  });
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
