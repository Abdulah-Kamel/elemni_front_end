import { backendErrorResponse, backendFetch } from "@/src/lib/student-api/backend";
import type { LoginDto, UserDto } from "@/src/lib/student-api/contract";
import { setSession } from "@/src/lib/student-api/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return Response.json({ detail: "البريد الإلكتروني وكلمة المرور مطلوبان." }, { status: 400 });
  }

  const result = await backendFetch<LoginDto>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: body.email, password: body.password }),
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
      { detail: "هذا الدخول مخصص لحسابات الطلاب." },
      { status: 403 },
    );
  }

  await setSession(result.data.access_token, result.data.refresh_token);
  return Response.json({ email: result.data.email, name: result.data.name });
}
