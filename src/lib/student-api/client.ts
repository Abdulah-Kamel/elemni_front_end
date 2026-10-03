export class StudentApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail?: string;
  readonly retryAfterSec?: number;

  constructor(status: number, code: string, detail?: string, retryAfterSec?: number) {
    super(detail ?? code);
    this.name = "StudentApiError";
    this.status = status;
    this.code = code;
    this.detail = detail;
    this.retryAfterSec = retryAfterSec;
  }
}

export async function studentApiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new StudentApiError(503, "SERVICE_UNAVAILABLE");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    // Optional chaining: existing unit tests mock fetch with plain objects that have no headers.
    const retryAfterHeader = response.headers?.get("Retry-After") ?? null;
    const retryAfterSec = retryAfterHeader && /^\d+$/.test(retryAfterHeader.trim())
      ? Number(retryAfterHeader.trim())
      : undefined;
    throw new StudentApiError(
      response.status,
      typeof body?.code === "string" ? body.code : `BACKEND_ERROR_${response.status}`,
      typeof body?.detail === "string" ? body.detail : undefined,
      retryAfterSec,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function isStudentUnauthorized(error: unknown) {
  return error instanceof StudentApiError && error.status === 401;
}

const API_ERROR_MESSAGE_KEYS = {
  SERVICE_UNAVAILABLE: "serviceUnavailable",
  REQUEST_FAILED: "requestFailed",
  SESSION_REQUIRED: "sessionRequired",
  SESSION_EXPIRED: "sessionExpired",
  COURSE_NOT_FOUND: "courseNotFound",
  INVALID_COURSE_ID: "invalidCourseId",
  CHECKOUT_UNAVAILABLE: "checkoutUnavailable",
  STUDENT_ACCOUNT_REQUIRED: "studentAccountRequired",
} as const;

export type ApiErrorMessageKey = (typeof API_ERROR_MESSAGE_KEYS)[keyof typeof API_ERROR_MESSAGE_KEYS];

export function getStudentErrorMessage(
  error: unknown,
  fallback: string,
  translate?: (key: ApiErrorMessageKey) => string,
) {
  if (!error) return "";
  if (!(error instanceof StudentApiError)) return fallback;
  const messageKey = API_ERROR_MESSAGE_KEYS[error.code as keyof typeof API_ERROR_MESSAGE_KEYS];
  return messageKey && translate ? translate(messageKey) : error.detail || fallback;
}
