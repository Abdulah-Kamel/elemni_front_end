import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  backendErrorResponse: vi.fn((error: { status: number; message: string }) =>
    Response.json({ detail: error.message }, { status: error.status }),
  ),
  authenticatedBackendFetch: vi.fn(),
  getAccessToken: vi.fn(),
}));

vi.mock("@/src/lib/student-api/backend", () => mocks);
vi.mock("@/src/lib/student-api/session", () => ({
  authenticatedBackendFetch: mocks.authenticatedBackendFetch,
  getAccessToken: mocks.getAccessToken,
}));

import { GET } from "./route";

const publicCourse = {
  id: 12,
  title: "كورس التفاضل",
  description: "شرح مبسط للتفاضل.",
  img: null,
  price: "250.00",
  subject_name: "الرياضيات",
  grade_id: 3,
  stream_id: 1,
  total_duration_minutes: 180,
  lesson_count: 1,
  use_chapters: true,
  is_subscribed: false,
  created_at: "2026-08-01T00:00:00Z",
  teacher_name: "أحمد علي",
  teacher_slug: "ahmad-ali",
  chapters: [],
};

describe("GET /api/student/my-courses/[courseId]", () => {
  beforeEach(() => {
    mocks.backendFetch.mockReset();
    mocks.backendErrorResponse.mockClear();
    mocks.authenticatedBackendFetch.mockReset();
    mocks.getAccessToken.mockReset();
  });

  it("returns public course details for a guest without requiring my courses", async () => {
    mocks.getAccessToken.mockResolvedValue(undefined);
    mocks.authenticatedBackendFetch.mockResolvedValue({
      ok: false,
      error: { status: 401, message: "يرجى تسجيل الدخول أولاً." },
    });
    mocks.backendFetch.mockImplementation((path: string) => {
      if (path.startsWith("/api/v1/teachers?") || path === "/api/v1/teachers") {
        return Promise.resolve({
          ok: true,
          status: 200,
          data: [{ name: "أحمد علي", slug: "ahmad-ali", img: null }],
        });
      }
      return Promise.resolve({ ok: true, status: 200, data: publicCourse });
    });

    const response = await GET(
      new Request(
        "http://localhost/api/student/my-courses/12?teacher=ahmad-ali",
      ),
      { params: Promise.resolve({ courseId: "12" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      enrollment: null,
      course: { id: 12, title: "كورس التفاضل" },
      teacher: { slug: "ahmad-ali" },
    });
    expect(mocks.authenticatedBackendFetch).not.toHaveBeenCalled();
  });

  it("keeps protected enrolled detail on the authenticated path", async () => {
    mocks.getAccessToken.mockResolvedValue("access-token");
    const enrollment = {
      id: 9,
      course_id: 12,
      purchased_at: "2026-08-01T00:00:00Z",
      expires_at: "2026-09-01T00:00:00Z",
      course_price: "250.00",
      total_paid: "250.00",
      currency: "EGP",
      payment_status: "paid",
      progress: {
        completion_percent: 0,
        completed_item_ids: [],
        last_item_id: null,
        last_lesson_id: null,
        next_item_id: 101,
        next_lesson_id: null,
        last_opened_at: null,
      },
      course: publicCourse,
    };
    mocks.authenticatedBackendFetch
      .mockResolvedValueOnce({ ok: true, status: 200, data: { items: [enrollment] } })
      .mockResolvedValueOnce({ ok: true, status: 200, data: publicCourse });
    mocks.backendFetch.mockImplementation((path: string) => {
      if (path.startsWith("/api/v1/teachers?") || path === "/api/v1/teachers") {
        return Promise.resolve({
          ok: true,
          status: 200,
          data: [{ name: "أحمد علي", slug: "ahmad-ali", img: null }],
        });
      }
      return Promise.resolve({ ok: true, status: 200, data: publicCourse });
    });

    const response = await GET(
      new Request("http://localhost/api/student/my-courses/12"),
      { params: Promise.resolve({ courseId: "12" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      enrollment: { id: 9, course_id: 12 },
      course: { id: 12 },
    });
    expect(mocks.authenticatedBackendFetch).toHaveBeenCalledTimes(2);
  });
});
