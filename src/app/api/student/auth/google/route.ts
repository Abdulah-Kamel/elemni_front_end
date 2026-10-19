import { backendErrorResponse, backendFetch } from "@/src/lib/student-api/backend";
import type { GoogleLoginDto, UserDto } from "@/src/lib/student-api/contract";
import { setSession } from "@/src/lib/student-api/session";
import messages from "@/src/messages/ar.json";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (typeof body?.credential !== "string" || !body.credential.trim()) {
    return Response.json(
      { detail: messages.auth.google.credentialRequired },
      { status: 400 },
    );
  }

  const result = await backendFetch<GoogleLoginDto>("/api/v1/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: body.credential }),
  });
  if (!result.ok) return backendErrorResponse(result.error);

  const user = await backendFetch<UserDto>("/api/v1/auth/me", {
    headers: { Authorization: `Bearer ${result.data.access_token}` },
  });
  if (!user.ok) return backendErrorResponse(user.error);
  if (user.data.role !== "STUDENT") {
    await backendFetch("/api/v1/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: result.data.refresh_token }),
    });
    return Response.json(
      { detail: messages.auth.google.notStudent },
      { status: 403 },
    );
  }

  await setSession(result.data.access_token, result.data.refresh_token);
  return Response.json({ is_new_user: result.data.is_new_user });
}
