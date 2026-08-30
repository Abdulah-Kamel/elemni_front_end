import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StudentCourseDetailDto } from "@/src/lib/student-api/contract";
import CourseDetail from "./course-detail";

vi.mock("@/src/features/portal/components/portal-shell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/src/components/ui/global-loading", () => ({
  GlobalLoading: () => <div>loading</div>,
}));

const replaceMock = vi.fn();

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useRouter: () => ({ replace: replaceMock }),
}));

const course: StudentCourseDetailDto["course"] = {
  id: 12,
  title: "كورس التفاضل",
  description: "شرح مبسط للتفاضل من البداية للنهاية.",
  img: "https://cdn.elemni.test/cover.jpg",
  price: "250.00",
  subject_name: "الرياضيات",
  grade_id: 3,
  stream_id: 1,
  total_duration_minutes: 180,
  lesson_count: 1,
  use_chapters: true,
  is_subscribed: true,
  created_at: "2026-08-01T00:00:00Z",
  teacher_name: "أحمد علي",
  teacher_slug: "ahmad-ali",
  chapters: [
    {
      id: 1,
      title: "الوحدة الأولى",
      order: 1,
      lessons: [
        {
          id: 11,
          title: "مقدمة في النهايات",
          description: "الأساسيات",
          order: 1,
          duration_minutes: 20,
          items: [
            {
              id: 101,
              title: "فيديو الشرح",
              order: 1,
              duration_minutes: 20,
              has_video: true,
              has_document: false,
              has_exam: false,
              bunny_stream_embed_url:
                "https://iframe.mediadelivery.net/play/123",
              document_path: null,
              exam_id: null,
            },
          ],
        },
      ],
    },
  ],
};

const detail: StudentCourseDetailDto = {
  course,
  teacher: {
    name: "أحمد علي",
    slug: "ahmad-ali",
    img: "https://cdn.elemni.test/teacher.jpg",
  },
  enrollment: {
    id: 9,
    course_id: 12,
    purchased_at: "2026-08-01T00:00:00Z",
    expires_at: "2026-09-01T00:00:00Z",
    course_price: "250.00",
    total_paid: "250.00",
    currency: "EGP",
    payment_status: "paid",
    course,
  },
};

const fetchMock = vi.fn();

describe("CourseDetail production experience", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    replaceMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("embeds the first playable lesson for an enrolled student", async () => {
    fetchMock.mockImplementation((input: string | URL) => {
      const url = String(input);

      if (url.startsWith("/api/student/my-courses/12")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => detail,
        });
      }

      if (url === "/api/student/auth/me") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: 1, name: "الطالب" }),
        });
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ detail: "not found" }),
      });
    });

    render(
      <CourseDetail
        courseId={12}
        teacherSlug="ahmad-ali"
        grades={[{ id: 3, name: "الصف الثالث الثانوي", level: "secondary" }]}
        streams={[{ id: 1, name: "علمي علوم", slug: "science" }]}
      />,
    );

    expect(
      await screen.findByTitle("مقدمة في النهايات - فيديو الشرح"),
    ).toHaveAttribute("src", "https://iframe.mediadelivery.net/play/123");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
