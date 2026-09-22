import { cleanup, render, screen } from "@testing-library/react";
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

  it("uses an accessible dark brand surface for the next-step card", () => {
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

    expect(screen.getByRole("complementary", { name: "خطوتك التالية" })).toHaveClass(
      "bg-brand-700",
      "text-white",
    );
  });
});
