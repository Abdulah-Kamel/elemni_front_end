import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicCourseDto } from "@/src/lib/student-api/contract";
import arMessages from "@/src/messages/ar.json";
import CourseDiscovery from "./course-discovery";

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: () => <span aria-hidden="true" />,
}));

const courses: PublicCourseDto[] = [
  {
    id: 1,
    title: "أساسيات الفيزياء",
    description: "شرح مبسط للحركة والطاقة",
    img: null,
    price: "250",
    subject_name: "الفيزياء",
    grade_id: 3,
    stream_id: 2,
    total_duration_minutes: 420,
    lesson_count: 18,
    use_chapters: true,
    chapters: [],
    is_subscribed: false,
    created_at: "2026-09-01T00:00:00Z",
    teacher_name: "أحمد حسن",
    teacher_slug: "ahmed-hassan",
  },
  {
    id: 2,
    title: "مراجعة الكيمياء",
    description: "تدريب عملي قبل الامتحان",
    img: null,
    price: 0,
    subject_name: "الكيمياء",
    grade_id: 2,
    stream_id: 1,
    total_duration_minutes: 90,
    lesson_count: 6,
    use_chapters: false,
    chapters: [],
    is_subscribed: false,
    created_at: "2026-08-28T00:00:00Z",
    teacher_name: "سارة علي",
    teacher_slug: "sara-ali",
  },
];

function CourseDiscoveryHarness() {
  const [query, setQuery] = useState("");

  return (
    <NextIntlClientProvider locale="ar" messages={arMessages}>
      <CourseDiscovery
        courses={courses}
        grades={[
          { id: 2, name: "الصف الثاني الثانوي", level: "secondary" },
          { id: 3, name: "الصف الثالث الثانوي", level: "secondary" },
        ]}
        streams={[
          { id: 1, name: "علمي علوم", slug: "science" },
          { id: 2, name: "علمي رياضة", slug: "math" },
        ]}
        subjects={[
          { id: 1, name: "الفيزياء", slug: "physics", streams: [], grades: [] },
          { id: 2, name: "الكيمياء", slug: "chemistry", streams: [], grades: [] },
        ]}
        searchQuery={query}
        onSearchChange={setQuery}
      />
    </NextIntlClientProvider>
  );
}

describe("CourseDiscovery", () => {
  afterEach(cleanup);

  it("keeps course cards compact while preserving the key purchase details", () => {
    render(<CourseDiscoveryHarness />);

    expect(screen.getAllByTestId("course-card-image")[0]).toHaveClass("h-36");
    expect(screen.getByText("الفيزياء")).toHaveClass("w-fit");
    expect(screen.getByText("أساسيات الفيزياء").closest("article")).toHaveClass("rounded-2xl");
    expect(screen.getByText(/بواسطة أحمد حسن/)).toHaveClass("truncate");
    expect(screen.getByRole("link", { name: /أساسيات الفيزياء/ })).toHaveAttribute(
      "href",
      "/courses/1?teacher=ahmed-hassan",
    );
    expect(screen.queryByRole("link", { name: "عرض التفاصيل" })).not.toBeInTheDocument();
    expect(screen.queryByText("عرض التفاصيل")).not.toBeInTheDocument();
  });

  it("updates the visible result count when a student searches", () => {
    render(<CourseDiscoveryHarness />);

    fireEvent.change(screen.getByRole("searchbox", { name: /البحث في الكورسات/ }), {
      target: { value: "أحمد" },
    });

    expect(screen.getByText("1 كورسات متاحة")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "أساسيات الفيزياء" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "مراجعة الكيمياء" })).not.toBeInTheDocument();
  });
});
