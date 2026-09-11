import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  backendErrorResponse: vi.fn((error: { status: number; message: string }) =>
    Response.json({ detail: error.message }, { status: error.status }),
  ),
  authenticatedBackendFetch: vi.fn(),
}));

vi.mock("@/src/lib/student-api/backend", () => ({
  backendErrorResponse: mocks.backendErrorResponse,
}));

vi.mock("@/src/lib/student-api/session", () => ({
  authenticatedBackendFetch: mocks.authenticatedBackendFetch,
}));

import { POST } from "./route";

function postCheckout(body: unknown) {
  return POST(
    new Request("http://localhost/api/student/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/student/payments/checkout", () => {
  beforeEach(() => {
    mocks.authenticatedBackendFetch.mockReset();
    mocks.backendErrorResponse.mockClear();
  });

  it.each([{ course_id: 0 }, { course_id: -3 }, { course_id: 1.5 }, { course_id: "abc" }, {}])(
    "rejects invalid course IDs with 400: %j",
    async (body) => {
      const response = await postCheckout(body);

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        detail: expect.any(String),
      });
      expect(mocks.authenticatedBackendFetch).not.toHaveBeenCalled();
    },
  );

  it("forwards the course ID and returns the Kashier redirect_url unchanged", async () => {
    const kashierUrl = "https://checkout.kashier.io/session/abc123";
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: { redirect_url: kashierUrl },
    });

    const response = await postCheckout({ course_id: 12 });

    expect(mocks.authenticatedBackendFetch).toHaveBeenCalledWith(
      "/api/v1/payments/checkout",
      { method: "POST", body: JSON.stringify({ course_id: 12 }) },
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ redirect_url: kashierUrl });
  });

  it("returns the backend free-course relative redirect without rewriting it", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: { redirect_url: "/my-courses" },
    });

    const response = await postCheckout({ course_id: 7 });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ redirect_url: "/my-courses" });
  });

  it("rejects a malformed backend redirect contract with 502", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: { redirect_url: 42 },
    });

    const response = await postCheckout({ course_id: 12 });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      detail: expect.any(String),
    });
  });

  it("rejects an unsafe backend redirect URL with 502", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: { redirect_url: "javascript:alert(1)" },
    });

    const response = await postCheckout({ course_id: 12 });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      detail: expect.any(String),
    });
  });

  it("forwards backend checkout errors with their status", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: false,
      error: { status: 409, message: "Already enrolled" },
    });

    const response = await postCheckout({ course_id: 12 });

    expect(mocks.backendErrorResponse).toHaveBeenCalledWith({
      status: 409,
      message: "Already enrolled",
    });
    expect(response.status).toBe(409);
  });
});
