import { backendErrorResponse, backendFetch } from "@/src/lib/student-api/backend";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.email) return Response.json({ detail: "البريد الإلكتروني مطلوب." }, { status: 400 });

  const result = await backendFetch<null>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: body.email }),
  });
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json({ accepted: true }, { status: 202 });
}
