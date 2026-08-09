import { backendErrorResponse, backendFetch } from "@/src/lib/student-api/backend";
import type { LoginDto, UserDto } from "@/src/lib/student-api/contract";
import { setSession } from "@/src/lib/student-api/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.name || !body?.phone_number) {
    return Response.json({ detail: "جميع بيانات إنشاء الحساب مطلوبة." }, { status: 400 });
  }

  const registered = await backendFetch<UserDto>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: body.email,
      password: body.password,
      name: body.name,
      phone_number: body.phone_number,
    }),
  });
  if (!registered.ok) return backendErrorResponse(registered.error);

  const loggedIn = await backendFetch<LoginDto>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: body.email, password: body.password }),
  });
  if (!loggedIn.ok) return backendErrorResponse(loggedIn.error);

  await setSession(loggedIn.data.access_token, loggedIn.data.refresh_token);
  return Response.json(registered.data, { status: 201 });
}
