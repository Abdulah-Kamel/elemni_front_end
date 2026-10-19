import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StudentProfileDto } from "@/src/lib/student-api/contract";
import StudentDashboard from "./student-dashboard";
import arMessages from "@/src/messages/ar.json";

const { courseItems, profileState } = vi.hoisted(() => ({
  courseItems: [] as Record<string, unknown>[],
  profileState: { data: undefined as StudentProfileDto | undefined, isError: true, isSuccess: false },
}));

const DRAFT_KEY = "elemni-student-onboarding-v1";
const grades = [{ id: 1, name: "Grade one", level: "1" }, { id: 9, name: "Draft grade", level: "9" }];
const streams = [{ id: 2, name: "Science", slug: "science" }];

function setProfile(data: StudentProfileDto) {
  profileState.data = data;
  profileState.isError = false;
  profileState.isSuccess = true;
}

function renderDashboard() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <StudentDashboard grades={grades} streams={streams} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

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
  useStudentProfile: () => profileState,
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

vi.mock("@/src/features/student/hooks/use-video-analytics-queries", () => ({
  useLastWatched: () => ({ data: undefined }),
}));

describe("StudentDashboard analysis surface", () => {
  beforeEach(() => {
    profileState.data = undefined;
    profileState.isError = true;
    profileState.isSuccess = false;
  });
  afterEach(() => {
    cleanup();
    courseItems.length = 0;
    localStorage.clear();
    sessionStorage.clear();
  });

  it("labels the study profile from the backend, not the device draft, and links to editing it", async () => {
    setProfile({ grade_id: 1, stream_id: 2, subject_ids: [], phone_number: "01000000000" });
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ owner_id: 1, grade_id: 9, stream_id: 2, subject_ids: [] }));
    renderDashboard();
    expect(screen.getByRole("link", { name: "Grade one - Science" })).toHaveAttribute("href", "/onboarding?edit=1");
    expect(screen.queryByText("Draft grade - Science")).not.toBeInTheDocument();
  });

  it("asks to complete the study profile when the backend profile is empty", () => {
    setProfile({ grade_id: null, stream_id: null, subject_ids: [], phone_number: "01000000000" });
    renderDashboard();
    expect(screen.getByRole("link", { name: "أكمل ملفك الدراسي" })).toHaveAttribute("href", "/onboarding");
  });

  it("falls back to this student's device draft when the profile can't be loaded", async () => {
    const draft = JSON.stringify({ version: 1, owner_id: 1, grade_id: 1, stream_id: 2, subject_ids: [3] });
    localStorage.setItem(DRAFT_KEY, draft);
    renderDashboard();
    await waitFor(() => expect(screen.getByText("Grade one - Science")).toBeInTheDocument());
    expect(localStorage.getItem(DRAFT_KEY)).toBe(draft);
  });

  it("ignores another student's draft when the profile can't be loaded", async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ owner_id: 2, grade_id: 1, stream_id: 2, subject_ids: [3] }));
    renderDashboard();
    await screen.findByRole("link", { name: "أكمل ملفك الدراسي" });
    expect(screen.queryByText("Grade one - Science")).not.toBeInTheDocument();
  });

  it.each([
    { phone: "01000000000", visible: false },
    { phone: null, visible: true },
  ])("shows the phone reminder only without a phone ($phone)", ({ phone, visible }) => {
    setProfile({ grade_id: 1, stream_id: 2, subject_ids: [], phone_number: phone });
    renderDashboard();
    const reminder = screen.queryByRole("heading", { name: arMessages.studentDashboard.phoneReminder.title });
    if (visible) expect(reminder).toBeInTheDocument();
    else expect(reminder).not.toBeInTheDocument();
  });

  it("does not remind about the phone while the profile can't be loaded", () => {
    renderDashboard();
    expect(screen.queryByRole("heading", { name: arMessages.studentDashboard.phoneReminder.title })).not.toBeInTheDocument();
  });

  it("does not render discovery recommendations or exploration actions", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
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
      <NextIntlClientProvider locale="ar" messages={arMessages}>
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
      <NextIntlClientProvider locale="ar" messages={arMessages}>
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
