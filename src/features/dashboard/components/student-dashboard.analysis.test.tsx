import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentDashboard from "./student-dashboard";

const { courseItems } = vi.hoisted(() => ({ courseItems: [] as Record<string, unknown>[] }));

vi.mock("@/src/features/portal/components/portal-shell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <span role="img" aria-label={alt} />,
}));

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/src/features/student/hooks/use-student-queries", () => ({
  useCurrentStudent: () => ({
    data: { id: 1, name: "عبدالله" },
    error: null,
    isPending: false,
    refetch: vi.fn(),
  }),
  useMyCourses: () => ({
    data: { items: courseItems },
    error: null,
    isPending: false,
    refetch: vi.fn(),
  }),
}));

describe("StudentDashboard analysis surface", () => {
  afterEach(() => {
    cleanup();
    courseItems.length = 0;
  });

  it("does not render discovery recommendations or exploration actions", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <StudentDashboard
          grades={[]}
          streams={[]}
        />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByRole("heading", { name: "مقترحات إضافية ليك" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "تصفح الكورسات" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "استكشف الكورسات" })).not.toBeInTheDocument();
  });

  it("uses a high-contrast brand surface for the continue-learning card", () => {
    courseItems.push({
      id: 1,
      purchased_at: "2026-09-01T00:00:00Z",
      expires_at: "2026-10-01T00:00:00Z",
      course: {
        id: 7,
        title: "JavaScript Advanced",
        description: "Course description",
        lesson_count: 12,
        total_duration_minutes: 360,
        subject_name: "Computer Science",
        img: null,
      },
      progress: {
        completion_percent: 50,
        last_opened_at: "2026-09-20T00:00:00Z",
      },
    });

    render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <StudentDashboard grades={[]} streams={[]} />
      </NextIntlClientProvider>,
    );

    const continueLearning = screen.getByRole("region", { name: "تابع التعلّم" });
    expect(continueLearning).toHaveClass("sticker-tile-brand", "border-2");
    expect(screen.getByRole("progressbar", { name: "نسبة إنجاز 50%" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /تابع التعلّم/ })).toBeInTheDocument();
  });

  it("filters enrolled courses by progress status", () => {
    courseItems.push(
      {
        id: 1,
        purchased_at: "2026-09-01T00:00:00Z",
        expires_at: "2026-10-01T00:00:00Z",
        course: { id: 7, title: "Course in progress", lesson_count: 3, total_duration_minutes: 60, img: null },
        progress: { completion_percent: 40, last_opened_at: "2026-09-20T00:00:00Z" },
      },
      {
        id: 2,
        purchased_at: "2026-08-01T00:00:00Z",
        expires_at: "2026-10-10T00:00:00Z",
        course: { id: 8, title: "Course completed", lesson_count: 2, total_duration_minutes: 45, img: null },
        progress: { completion_percent: 100, last_opened_at: "2026-09-10T00:00:00Z" },
      },
    );

    render(
      <NextIntlClientProvider locale="ar" messages={{}}>
        <StudentDashboard grades={[]} streams={[]} />
      </NextIntlClientProvider>,
    );

    expect(screen.getAllByText("Course in progress").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Course completed").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /مكتملة/ }));
    expect(screen.queryByRole("link", { name: "فتح كورس Course in progress" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Course completed").length).toBeGreaterThan(0);
  });
});
