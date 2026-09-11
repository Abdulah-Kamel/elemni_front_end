import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Teacher } from "../../types";
import arMessages from "@/src/messages/ar.json";
import enMessages from "@/src/messages/en.json";
import TeacherProfileView from "./teacher-profile-view";

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const teacher: Teacher = {
  id: "ahmad-ali",
  name: "أحمد علي",
  title: "مدرس رياضيات للمرحلة الثانوية",
  subject: "الرياضيات",
  subjects: ["الرياضيات", "تفاضل"],
  category: "math",
  grade: "3",
  gradeLabel: "الصف الثالث الثانوي",
  gradesList: ["الصف الثاني الثانوي", "الصف الثالث الثانوي"],
  gradeIds: ["2", "3"],
  streamIds: ["1"],
  avatar: "https://cdn.elemni.test/teacher.jpg",
  studentCount: 0,
  experienceYears: 12,
  pricePerSession: 250,
  bio: "أشرح المادة بطريقة عملية مع تدريبات متدرجة.",
  specialties: ["الرياضيات", "تفاضل"],
  schedule: [],
  location: "أونلاين",
  courses: [
    {
      id: "12",
      title: "كورس التفاضل",
      description: "شرح مبسط للتفاضل من البداية للنهاية.",
      price: 250,
      duration: "3 ساعات",
      sessionsCount: 12,
      image: "https://cdn.elemni.test/cover.jpg",
      isSubscribed: true,
      chapters: [
        {
          id: 1,
          title: "الوحدة الأولى",
          lessons: [
            {
              id: 11,
              title: "مقدمة في النهايات",
              description: "الأساسيات",
              durationMinutes: 20,
              items: [
                {
                  id: 101,
                  title: "فيديو الشرح",
                  hasVideo: true,
                  hasDocument: false,
                  hasExam: false,
                  videoUrl: "https://iframe.mediadelivery.net/play/123",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("TeacherProfileView production experience", () => {
  const originalLocation = Object.getOwnPropertyDescriptor(window, "location");
  const assignMock = vi.fn();
  const fetchMock = vi.fn();

  function renderProfile(teacherOverride: Teacher, locale: "ar" | "en" = "ar") {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <NextIntlClientProvider
        locale={locale}
        messages={locale === "ar" ? arMessages : enMessages}
      >
        <QueryClientProvider client={queryClient}>
          <TeacherProfileView
            teacher={teacherOverride}
            onRequireAuth={() => undefined}
          />
        </QueryClientProvider>
      </NextIntlClientProvider>,
    );
  }

  beforeEach(() => {
    fetchMock.mockReset();
    assignMock.mockClear();
    vi.stubGlobal("fetch", fetchMock);
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        assign: assignMock,
        pathname: "/teachers/ahmad-ali",
        search: "",
        href: "http://localhost/teachers/ahmad-ali",
        origin: "http://localhost",
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    if (originalLocation) Object.defineProperty(window, "location", originalLocation);
  });

  it("expands a subscribed course without navigating away", () => {
    renderProfile(teacher);

    expect(screen.queryByText("مقدمة في النهايات")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /عرض المحتوى|محتوى الكورس/ }),
    );

    expect(screen.getByText("مقدمة في النهايات")).toBeInTheDocument();
    expect(screen.getByText("فيديو الشرح")).toBeInTheDocument();
  });

  it("sends paid checkout to the Kashier URL unchanged", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ redirect_url: "https://checkout.kashier.io/session/test123" }),
    });
    renderProfile({ ...teacher, courses: [{ ...teacher.courses[0], isSubscribed: false }] });

    fireEvent.click(screen.getByRole("button", { name: "اشترك الآن" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/student/payments/checkout",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ course_id: 12 }),
        }),
      );
    });
    await waitFor(() => expect(assignMock).toHaveBeenCalledTimes(1));
    expect(assignMock).toHaveBeenCalledWith(
      "https://checkout.kashier.io/session/test123",
    );
  });

  it("keeps the free-course redirect on the localized in-app route", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ redirect_url: "/my-courses" }),
    });
    renderProfile(
      { ...teacher, courses: [{ ...teacher.courses[0], isSubscribed: false }] },
      "en",
    );

    fireEvent.click(screen.getByRole("button", { name: "اشترك الآن" }));

    await waitFor(() => expect(assignMock).toHaveBeenCalledTimes(1));
    expect(assignMock).toHaveBeenCalledWith("/en/my-courses");
  });
});
