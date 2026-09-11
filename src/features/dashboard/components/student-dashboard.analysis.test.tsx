import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import StudentDashboard from "./student-dashboard";

vi.mock("@/src/features/portal/components/portal-shell", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
    data: { items: [] },
    error: null,
    isPending: false,
    refetch: vi.fn(),
  }),
}));

describe("StudentDashboard analysis surface", () => {
  afterEach(() => cleanup());

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
});
