import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticatedBackendFetch: vi.fn(),
  backendErrorResponse: vi.fn((error: { status: number; message: string }) =>
    Response.json({ detail: error.message }, { status: error.status }),
  ),
}));

vi.mock("@/src/lib/student-api/session", () => ({
  authenticatedBackendFetch: mocks.authenticatedBackendFetch,
}));
vi.mock("@/src/lib/student-api/backend", () => ({
  backendErrorResponse: mocks.backendErrorResponse,
}));

import { PUT } from "./route";

describe("PUT /api/student/my-courses/[courseId]/progress", () => {
  beforeEach(() => {
    mocks.authenticatedBackendFetch.mockReset();
    mocks.backendErrorResponse.mockClear();
  });

  it("forwards the Arabic student progress payload to the backend", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        completion_percent: 50,
        completed_item_ids: [101],
        last_item_id: 101,
        last_lesson_id: 11,
        next_item_id: 102,
        next_lesson_id: 11,
        last_opened_at: "2026-09-09T12:00:00Z",
      },
    });

    const response = await PUT(
      new Request("http://localhost/api/student/my-courses/12/progress", {
        method: "PUT",
        body: JSON.stringify({ item_id: 101, completed: true }),
      }),
      { params: Promise.resolve({ courseId: "12" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      completion_percent: 50,
      next_item_id: 102,
    });
    expect(mocks.authenticatedBackendFetch).toHaveBeenCalledWith(
      "/api/v1/my/courses/12/progress",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ item_id: 101, completed: true }),
      }),
    );
  });

  it("returns the backend error message", async () => {
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: false,
      error: { status: 403, message: "لا يمكنك تحديث تقدم هذا الكورس." },
    });

    const response = await PUT(
      new Request("http://localhost/api/student/my-courses/12/progress", {
        method: "PUT",
        body: JSON.stringify({ item_id: 999, completed: true }),
      }),
      { params: Promise.resolve({ courseId: "12" }) },
    );

    expect(response.status).toBe(403);
    expect(mocks.backendErrorResponse).toHaveBeenCalledWith({
      status: 403,
      message: "لا يمكنك تحديث تقدم هذا الكورس.",
    });
  });
});
