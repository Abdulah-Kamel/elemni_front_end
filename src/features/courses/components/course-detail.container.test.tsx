import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StudentCourseDetailDto } from "@/src/lib/student-api/contract";
import arMessages from "@/src/messages/ar.json";
import enMessages from "@/src/messages/en.json";
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

const publicDetail: StudentCourseDetailDto = {
  ...detail,
  enrollment: null,
  course: { ...course, is_subscribed: false },
};

const fetchMock = vi.fn();

describe("CourseDetail production experience", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    replaceMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
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

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <QueryClientProvider client={queryClient}>
          <CourseDetail
            courseId={12}
            teacherSlug="ahmad-ali"
            grades={[{ id: 3, name: "الصف الثالث الثانوي", level: "secondary" }]}
            streams={[{ id: 1, name: "علمي علوم", slug: "science" }]}
          />
        </QueryClientProvider>
      </NextIntlClientProvider>,
    );

    expect(
      await screen.findByTitle("مقدمة في النهايات - فيديو الشرح"),
    ).toHaveAttribute("src", "https://iframe.mediadelivery.net/play/123");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("renders public course discovery without requesting a student profile", async () => {
    fetchMock.mockImplementation((input: string | URL) => {
      const url = String(input);

      if (url.startsWith("/api/student/my-courses/12")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => publicDetail,
        });
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ detail: "not found" }),
      });
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <QueryClientProvider client={queryClient}>
          <CourseDetail
            courseId={12}
            teacherSlug="ahmad-ali"
            isAuthenticated={false}
            grades={[{ id: 3, name: "الصف الثالث الثانوي", level: "secondary" }]}
            streams={[{ id: 1, name: "علمي علوم", slug: "science" }]}
          />
        </QueryClientProvider>
      </NextIntlClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "كورس التفاضل" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "اشترك في الكورس" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("confirms the backend price before starting checkout", async () => {
    fetchMock.mockImplementation((input: string | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.startsWith("/api/student/my-courses/12")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => publicDetail,
        });
      }

      if (url === "/api/student/auth/me") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ id: 1, name: "الطالب" }),
        });
      }

      if (url === "/api/student/payments/checkout" && init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ redirect_url: "https://paytabs.test/checkout" }),
        });
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ detail: "not found" }),
      });
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <QueryClientProvider client={queryClient}>
          <CourseDetail
            courseId={12}
            teacherSlug="ahmad-ali"
            grades={[]}
            streams={[]}
          />
        </QueryClientProvider>
      </NextIntlClientProvider>,
    );

    await screen.findByRole("heading", { name: "كورس التفاضل" });
    await screen.findByRole("button", { name: "اشترك في الكورس" });
    const purchaseButton = screen.getAllByRole("button", { name: "اشترك في الكورس" })[0];
    fireEvent.click(purchaseButton);

    expect(await screen.findByRole("dialog")).toHaveTextContent(/250|٢٥٠/);
    expect(screen.getByText("ستحصل على وصول كامل للكورس لمدة 30 يوماً.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(fetchMock.mock.calls.some(([input]) => String(input) === "/api/student/payments/checkout")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "اشترك في الكورس" }));
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: "المتابعة إلى الدفع" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/student/payments/checkout",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ course_id: 12 }),
        }),
      );
    });
  });

  it("renders the purchase surface in English when the locale changes", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => publicDetail,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <QueryClientProvider client={queryClient}>
          <CourseDetail
            courseId={12}
            teacherSlug="ahmad-ali"
            isAuthenticated={false}
            grades={[]}
            streams={[]}
          />
        </QueryClientProvider>
      </NextIntlClientProvider>,
    );

    expect(await screen.findByRole("button", { name: "Enroll in this course" })).toBeInTheDocument();
    expect(screen.getByText("EGP")).toBeInTheDocument();
  });
});
