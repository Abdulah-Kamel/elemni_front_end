export class StudentApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "StudentApiError";
    this.status = status;
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
    throw new StudentApiError("خدمة المنصة غير متاحة حالياً.", 503);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new StudentApiError(
      typeof body?.detail === "string"
        ? body.detail
        : "تعذر إتمام الطلب حالياً.",
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function isStudentUnauthorized(error: unknown) {
  return error instanceof StudentApiError && error.status === 401;
}

export function getStudentErrorMessage(error: unknown, fallback: string) {
  if (!error) return "";
  return error instanceof StudentApiError ? error.message : fallback;
}
