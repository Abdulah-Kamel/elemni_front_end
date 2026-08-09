import { backendErrorResponse, backendFetch } from "@/src/lib/student-api/backend";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.token || !body?.new_password) return Response.json({ detail: "رابط الاستعادة وكلمة المرور مطلوبان." }, { status: 400 });

  const result = await backendFetch<{ detail: string }>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token: body.token, new_password: body.new_password }),
  });
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
