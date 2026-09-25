import { backendErrorResponse } from "@/src/lib/student-api/backend";
import { authenticatedBackendFetch, getAccessToken } from "@/src/lib/student-api/session";

type Context = { params: Promise<{ path: string[] }> };

// Only the course-test endpoints in docs/specs/course-tests-api.md are forwarded.
const ALLOWED: { method: string; pattern: RegExp }[] = [
  { method: "GET", pattern: /^my\/courses\/\d+\/tests$/ },
  { method: "GET", pattern: /^my\/courses\/\d+\/tests\/\d+$/ },
  { method: "POST", pattern: /^tests\/\d+\/attempts$/ },
  { method: "GET", pattern: /^attempts\/\d+$/ },
  { method: "PUT", pattern: /^attempts\/\d+\/answers\/\d+$/ },
  { method: "POST", pattern: /^attempts\/\d+\/submit$/ },
  { method: "GET", pattern: /^attempts\/\d+\/(result|review)$/ },
];

async function proxy(request: Request, { params }: Context) {
  const path = (await params).path.join("/");
  if (!ALLOWED.some((route) => route.method === request.method && route.pattern.test(path))) {
    return Response.json({ detail: "مسار الطلب غير صالح." }, { status: 404 });
  }
  if (!(await getAccessToken())) {
    return Response.json({ detail: "سجّل الدخول أولاً." }, { status: 401 });
  }

  const body = request.method === "GET" ? undefined : await request.text();
  const result = await authenticatedBackendFetch<unknown>(`/api/v1/${path}`, {
    method: request.method,
    ...(body ? { body } : {}),
    cache: "no-store",
  });
  if (!result.ok) return backendErrorResponse(result.error);
  if (result.status === 204) return new Response(null, { status: 204 });
  return Response.json(result.data, { status: result.status });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
