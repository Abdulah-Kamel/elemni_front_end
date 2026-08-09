import { backendFetch } from "@/src/lib/student-api/backend";
import { clearSession, getRefreshToken } from "@/src/lib/student-api/session";

export async function POST() {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await backendFetch("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }
  await clearSession();
  return new Response(null, { status: 204 });
}
