import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ExploreCourses, { type ExploreCourseEntry } from "./explore-courses";

vi.mock("next/image", () => ({
  default: () => <span data-testid="mock-image" />,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: { children: ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("motion/react", () => {
  const Motion = ({ children, ...props }: { children?: ReactNode; [key: string]: unknown }) => (
    <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
  );

  return {
    AnimatePresence: ({ children }: { children?: ReactNode }) => <>{children}</>,
    m: {
      div: Motion,
      header: Motion,
      section: Motion,
    },
  };
});

vi.mock("@/src/features/portal/components/portal-shell", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/src/features/student/hooks/use-student-queries", () => ({
  useCurrentStudent: () => ({
    data: { id: 1, name: "عبدالله" },
    error: null,
  }),
  useMyCourses: () => ({
    data: { items: [] },
    error: null,
  }),
}));

const catalog: ExploreCourseEntry[] = [
  {
    course: {
      id: 1,
      title: "كورس الرياضيات",
      description: "شرح أساسيات الرياضيات",
      img: null,
      price: 100,
      subject_name: "رياضيات",
      grade_id: 1,
      stream_id: 1,
      total_duration_minutes: 90,
      lesson_count: 3,
      use_chapters: false,
      chapters: [],
      is_subscribed: false,
      created_at: "2026-09-01T00:00:00Z",
      teacher_name: "أحمد",
      teacher_slug: "ahmed",
    },
    teacher: {
      name: "أحمد",
      slug: "ahmed",
      img: null,
      subjects: ["رياضيات"],
      grades: ["الثالث الثانوي"],
    },
  },
];

describe("ExploreCourses", () => {
  afterEach(() => cleanup());

  it("removes recommended courses while keeping the full course list", () => {
    render(
      <ExploreCourses
        catalog={catalog}
        teachers={[]}
        grades={[]}
        streams={[]}
        subjects={[]}
        loadError={false}
      />,
    );

    expect(screen.queryByRole("heading", { name: "مناسب لك" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "كل الكورسات" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "كورس الرياضيات" })).toBeInTheDocument();
  });

  it("keeps non-enrolled course cards inside the student dashboard shell", () => {
    render(
      <ExploreCourses
        catalog={catalog}
        teachers={[]}
        grades={[]}
        streams={[]}
        subjects={[]}
        loadError={false}
      />,
    );

    const cardLink = screen.getByRole("link", { name: "عرض كورس كورس الرياضيات" });
    expect(cardLink.getAttribute("href")).toBe(
      `/my-courses/1?teacher=${encodeURIComponent("ahmed")}`,
    );
  });
});
