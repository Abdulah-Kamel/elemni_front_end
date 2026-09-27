import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAccessToken, getRefreshToken, authenticatedBackendFetch } = vi.hoisted(() => ({
  getAccessToken: vi.fn(),
  getRefreshToken: vi.fn(),
  authenticatedBackendFetch: vi.fn(),
}));

vi.mock("@/src/lib/student-api/session", () => ({
  getAccessToken,
  getRefreshToken,
  authenticatedBackendFetch,
}));

import { GET } from "./route";

describe("GET /api/student/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a successful null user when no session cookie exists", async () => {
    getAccessToken.mockResolvedValue(undefined);
    getRefreshToken.mockResolvedValue(undefined);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user: null });
    expect(authenticatedBackendFetch).not.toHaveBeenCalled();
  });

  it("preserves unauthorized responses for an invalid session", async () => {
    getAccessToken.mockResolvedValue("expired-token");
    authenticatedBackendFetch.mockResolvedValue({
      ok: false,
      error: { status: 401, code: "SESSION_EXPIRED" },
    });

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("still asks the backend (which refreshes) when only the access cookie expired", async () => {
    getAccessToken.mockResolvedValue(undefined);
    getRefreshToken.mockResolvedValue("refresh-token");
    authenticatedBackendFetch.mockResolvedValue({ ok: true, status: 200, data: { id: 1, name: "طالب" } });

    const response = await GET();

    expect(authenticatedBackendFetch).toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ id: 1 });
  });
});
