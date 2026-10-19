import { backendErrorResponse } from "@/src/lib/student-api/backend";
import type { StudentProfileDto } from "@/src/lib/student-api/contract";
import { authenticatedBackendFetch } from "@/src/lib/student-api/session";

const PROFILE_PATH = "/api/v1/students/me/profile";

const isId = (value: unknown) => Number.isInteger(value) && (value as number) > 0;

/** Keeps only the profile fields the student sent, or null when one has the wrong type. */
function profilePatch(body: unknown): Partial<StudentProfileDto> | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const input = body as Record<string, unknown>;
  const patch: Partial<StudentProfileDto> = {};
  if ("phone_number" in input) {
    // The backend owns the phone format (^[0-9+ ]{10,20}$) and answers 422.
    if (input.phone_number !== null && typeof input.phone_number !== "string") return null;
    patch.phone_number = input.phone_number;
  }
  for (const key of ["grade_id", "stream_id"] as const) {
    if (!(key in input)) continue;
    if (input[key] !== null && !isId(input[key])) return null;
    patch[key] = input[key] as number | null;
  }
  if ("subject_ids" in input) {
    const ids = input.subject_ids;
    if (!Array.isArray(ids) || ids.length > 50 || !ids.every(isId)) return null;
    patch.subject_ids = ids;
  }
  return patch;
}

// No cookie pre-check: authenticatedBackendFetch answers 401 without a session and
// refreshes an expired access cookie when a refresh cookie is still there.

/** The student's study profile and phone number, as saved on the backend. */
export async function GET() {
  const result = await authenticatedBackendFetch<StudentProfileDto>(PROFILE_PATH, { cache: "no-store" });
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}

/** Saves any subset of phone, grade, stream and subjects; omitted fields stay unchanged. */
export async function PUT(request: Request) {
  const patch = profilePatch(await request.json().catch(() => null));
  if (!patch) return Response.json({ code: "REQUEST_FAILED" }, { status: 400 });
  const result = await authenticatedBackendFetch<StudentProfileDto>(PROFILE_PATH, {
    method: "PUT",
    body: JSON.stringify(patch),
    cache: "no-store",
  });
  if (!result.ok) return backendErrorResponse(result.error);
  return Response.json(result.data);
}
