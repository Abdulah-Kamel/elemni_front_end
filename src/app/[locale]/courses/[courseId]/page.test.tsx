import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getGrades: vi.fn(),
  getStreams: vi.fn(),
  getPublicCourses: vi.fn(),
  getPublicTeacher: vi.fn(),
  getPublicTeacherCourses: vi.fn(),
  getPublicTeacherCourse: vi.fn(),
  getAccessToken: vi.fn(),
  setRequestLocale: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

vi.mock("next-intl/server", () => ({
  setRequestLocale: mocks.setRequestLocale,
}));

vi.mock("@/src/features/courses/components/course-detail", () => ({
  default: () => null,
}));

vi.mock("@/src/lib/student-api/public", () => ({
  getGrades: mocks.getGrades,
  getStreams: mocks.getStreams,
  getPublicCourses: mocks.getPublicCourses,
  getPublicTeacher: mocks.getPublicTeacher,
  getPublicTeacherCourses: mocks.getPublicTeacherCourses,
  getPublicTeacherCourse: mocks.getPublicTeacherCourse,
}));

vi.mock("@/src/lib/student-api/session", () => ({
  getAccessToken: mocks.getAccessToken,
}));

import CourseDetailPage from "./page";

const summaryCourse = {
  id: 53,
  title: "Introduction to Physics",
  description: "Summary",
  img: null,
  price: "250.00",
  subject_name: "Physics",
  grade_id: 10,
  stream_id: 1,
  total_duration_minutes: 180,
  lesson_count: 2,
  use_chapters: true,
  is_subscribed: false,
  created_at: "2026-08-01T00:00:00Z",
  teacher_name: "Ahmed Hassan",
  teacher_slug: "ahmed-hassan",
  chapters: [],
};

const fullCourse = {
  ...summaryCourse,
  description: "Full detail",
  chapters: [
    {
      id: 1,
      title: "Unit one",
      order: 1,
      lessons: [],
    },
  ],
};

describe("public course detail page", () => {
  it("seeds the client with the full course detail instead of catalog summary data", async () => {
    mocks.getAccessToken.mockResolvedValue(undefined);
    mocks.getGrades.mockResolvedValue({ ok: true, data: [], status: 200 });
    mocks.getStreams.mockResolvedValue({ ok: true, data: [], status: 200 });
    mocks.getPublicCourses.mockResolvedValue({ ok: true, data: [summaryCourse], status: 200 });
    mocks.getPublicTeacherCourses.mockResolvedValue({ ok: true, data: [summaryCourse], status: 200 });
    mocks.getPublicTeacher.mockResolvedValue({
      ok: true,
      status: 200,
      data: { name: "Ahmed Hassan", slug: "ahmed-hassan", img: null },
    });
    mocks.getPublicTeacherCourse.mockResolvedValue({ ok: true, data: fullCourse, status: 200 });

    const element = await CourseDetailPage({
      params: Promise.resolve({ locale: "ar", courseId: "53" }),
      searchParams: Promise.resolve({ teacher: "ahmed-hassan" }),
    });

    expect(mocks.getPublicTeacherCourse).toHaveBeenCalledWith("ahmed-hassan", 53);
    expect(element.props.initialDetail.course.chapters).toHaveLength(1);
    expect(element.props.initialDetail.course.chapters[0].title).toBe("Unit one");
  });
});
