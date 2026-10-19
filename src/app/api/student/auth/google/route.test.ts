import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  backendErrorResponse: vi.fn((error: { status: number; message: string }) =>
    Response.json({ detail: error.message }, { status: error.status }),
  ),
  setSession: vi.fn(),
}));

vi.mock("@/src/lib/student-api/backend", () => ({
  backendFetch: mocks.backendFetch,
  backendErrorResponse: mocks.backendErrorResponse,
}));
vi.mock("@/src/lib/student-api/session", () => ({ setSession: mocks.setSession }));

import { POST } from "./route";

function postGoogle(body: unknown) {
  return POST(new Request("http://localhost/api/student/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
}

const login = {
  access_token: "access", refresh_token: "refresh", token_type: "bearer",
  email: "student@example.com", name: "Student", is_new_user: true,
};
const user = {
  id: 1, email: login.email, name: login.name, phone_number: null,
  role: "STUDENT", is_active: true, created_at: "2026-10-19T00:00:00Z",
};

describe("POST /api/student/auth/google", () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it("sets session and returns is_new_user", async () => {
    mocks.backendFetch.mockResolvedValueOnce({ ok: true, status: 200, data: login })
      .mockResolvedValueOnce({ ok: true, status: 200, data: user });
    const response = await postGoogle({ credential: "tok" });
    expect(mocks.backendFetch).toHaveBeenNthCalledWith(1, "/api/v1/auth/google", {
      method: "POST", body: JSON.stringify({ id_token: "tok" }),
    });
    expect(mocks.backendFetch).toHaveBeenNthCalledWith(2, "/api/v1/auth/me", {
      headers: { Authorization: "Bearer access" },
    });
    expect(mocks.setSession).toHaveBeenCalledWith("access", "refresh");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ is_new_user: true });
  });

  it("rejects missing credential", async () => {
    const response = await postGoogle({});
    expect(response.status).toBe(400);
    expect(mocks.backendFetch).not.toHaveBeenCalled();
    expect(mocks.setSession).not.toHaveBeenCalled();
  });

  it("rejects non-student and logs out", async () => {
    mocks.backendFetch.mockResolvedValueOnce({ ok: true, status: 200, data: login })
      .mockResolvedValueOnce({ ok: true, status: 200, data: { ...user, role: "TEACHER" } })
      .mockResolvedValueOnce({ ok: true, status: 204, data: undefined });
    const response = await postGoogle({ credential: "tok" });
    expect(response.status).toBe(403);
    expect(mocks.backendFetch).toHaveBeenNthCalledWith(3, "/api/v1/auth/logout", {
      method: "POST", body: JSON.stringify({ refresh_token: "refresh" }),
    });
    expect(mocks.setSession).not.toHaveBeenCalled();
  });

  it("passes backend 401 through", async () => {
    mocks.backendFetch.mockResolvedValueOnce({ ok: false, error: { status: 401, message: "Invalid token" } });
    const response = await postGoogle({ credential: "tok" });
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ detail: "Invalid token" });
    expect(mocks.setSession).not.toHaveBeenCalled();
  });
});
