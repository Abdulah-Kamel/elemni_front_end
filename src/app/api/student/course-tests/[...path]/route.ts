import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, { params }: Context) {
  const { path } = await params;
  if (!path.length || path.some((part) => !/^[\w-]+$/.test(part))) {
    return Response.json({ detail: "مسار الطلب غير صالح." }, { status: 400 });
  }
  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.text();
  const result = await authenticatedBackendFetch<unknown>(`/api/v1/${path.join("/")}`, {
    method,
    ...(body ? { body } : {}),
    cache: "no-store",
  });
  if (!result.ok) return Response.json({ detail: result.error.message }, { status: result.error.status });
  return Response.json(result.data, { status: result.status });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
