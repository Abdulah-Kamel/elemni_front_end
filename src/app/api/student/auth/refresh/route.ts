import { clearSession, refreshAccessToken } from "@/src/lib/student-api/session";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedNext = requestUrl.searchParams.get("next");
  let next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/dashboard";
  // URL parsing treats backslashes as slashes; keep redirects on this origin.
  if (new URL(next, requestUrl).origin !== requestUrl.origin) next = "/dashboard";

  const refreshed = await refreshAccessToken();
  if (refreshed) return redirectTo(next);

  await clearSession();
  const loginPath = next.startsWith("/en/") ? "/en/login" : "/login";
  return redirectTo(`${loginPath}?next=${encodeURIComponent(next)}`);
}

// Relative Location: request.url can carry an internal host behind a reverse proxy.
function redirectTo(path: string) {
  return new Response(null, { status: 302, headers: { Location: path } });
}
