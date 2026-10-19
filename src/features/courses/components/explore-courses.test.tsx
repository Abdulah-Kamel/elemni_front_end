import type { ReactNode } from "react";
import { cleanup, fireEvent, render as rtlRender, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StudentProfileDto } from "@/src/lib/student-api/contract";
import arMessages from "@/src/messages/ar.json";
import ExploreCourses, { type ExploreCourseEntry } from "./explore-courses";

const render = (ui: ReactNode) =>
  rtlRender(<NextIntlClientProvider locale="ar" messages={arMessages}>{ui}</NextIntlClientProvider>);

vi.mock("next/image", () => ({
  default: () => <span data-testid="mock-image" />,
}));

const state = vi.hoisted(() => ({
  profile: { data: undefined as StudentProfileDto | undefined, isError: false },
  query: "",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(state.query),
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
      span: Motion,
      aside: Motion,
      button: Motion,
    },
  };
});

vi.mock("@/src/features/portal/components/portal-shell", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/src/features/student/hooks/use-student-queries", () => ({
  useStudentProfile: () => state.profile,
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
  beforeEach(() => {
    state.profile = { data: undefined, isError: false };
    state.query = "";
    localStorage.clear();
  });
  afterEach(() => cleanup());

  const DRAFT_KEY = "elemni-student-onboarding-v1";
  const grades = [{ id: 1, name: "Grade one", level: "1" }, { id: 2, name: "Grade two", level: "2" }];
  const streams = [{ id: 1, name: "Science", slug: "science" }];
  const subjects = [{ id: 3, name: "رياضيات", slug: "math", grades, streams }];
  const profile = { grade_id: 1, stream_id: 1, subject_ids: [3], phone_number: null };
  const props = { catalog, teachers: [], grades, streams, subjects, loadError: false, locale: "ar" };
  const gradeSelect = () => screen.getByRole("combobox", { name: "الصف الدراسي" });
  const streamSelect = () => screen.getByRole("combobox", { name: "الشعبة" });

  it("uses the backend profile for the label and the default filters", async () => {
    state.profile = { data: profile, isError: false };
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ owner_id: 1, grade_id: 2, stream_id: 1, subject_ids: [3] }));
    render(<ExploreCourses {...props} />);
    await waitFor(() => expect(screen.getByText("Grade one - Science")).toBeInTheDocument());
    expect(gradeSelect()).toHaveValue("1");
    expect(streamSelect()).toHaveValue("1");
    expect(within(screen.getByLabelText("مواد الكورسات")).getByRole("button", { name: "رياضيات" })).toHaveClass("bg-ink");
    fireEvent.change(gradeSelect(), { target: { value: "2" } });
    expect(gradeSelect()).toHaveValue("2");
  });

  it("falls back to this student's device draft when the profile can't be loaded", async () => {
    state.profile.isError = true;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, grade_id: 1, stream_id: 1, subject_ids: [3] }));
    render(<ExploreCourses {...props} />);
    await waitFor(() => expect(screen.getByText("Grade one - Science")).toBeInTheDocument());
    expect(gradeSelect()).toHaveValue("1");
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!)).toMatchObject({ owner_id: 1 });
  });

  it("ignores another student's draft when the profile can't be loaded", async () => {
    state.profile.isError = true;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ owner_id: 2, ...profile }));
    render(<ExploreCourses {...props} />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(screen.queryByText("Grade one - Science")).not.toBeInTheDocument();
    expect(gradeSelect()).toHaveValue("all");
  });

  it.each(["pending", "empty"])("does not use the draft while the profile is %s", async (status) => {
    if (status === "empty") state.profile.data = { phone_number: null, grade_id: null, stream_id: null, subject_ids: [] };
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ owner_id: 1, ...profile }));
    render(<ExploreCourses {...props} />);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(gradeSelect()).toHaveValue("all");
    expect(screen.queryByText("Grade one - Science")).not.toBeInTheDocument();
  });

  it("keeps filters given in the URL over the profile defaults", async () => {
    state.profile = { data: profile, isError: false };
    state.query = "grade=2&stream=all&subject=all";
    render(<ExploreCourses {...props} />);
    await waitFor(() => expect(screen.getByText("Grade one - Science")).toBeInTheDocument());
    expect(gradeSelect()).toHaveValue("2");
    expect(streamSelect()).toHaveValue("all");
    expect(screen.getByRole("button", { name: "كل المواد" })).toHaveClass("bg-ink");
  });

  it("keeps explicit 'all' filters when the URL is cleaned up before the profile arrives", async () => {
    state.query = "grade=all&stream=all&subject=all";
    const view = render(<ExploreCourses {...props} />);
    state.query = "";
    view.rerender(<NextIntlClientProvider locale="ar" messages={arMessages}><ExploreCourses {...props} /></NextIntlClientProvider>);
    state.profile = { data: profile, isError: false };
    view.rerender(<NextIntlClientProvider locale="ar" messages={arMessages}><ExploreCourses {...props} /></NextIntlClientProvider>);
    await waitFor(() => expect(screen.getByText("Grade one - Science")).toBeInTheDocument());
    expect(gradeSelect()).toHaveValue("all");
    expect(streamSelect()).toHaveValue("all");
    expect(screen.getByRole("button", { name: "كل المواد" })).toHaveClass("bg-ink");
  });

  it("filters by all the profile's subjects when it has more than one", async () => {
    state.profile = { data: { ...profile, subject_ids: [3, 4] }, isError: false };
    const moreSubjects = [...subjects, { id: 4, name: "فيزياء", slug: "physics", grades, streams }];
    const moreCatalog = [...catalog,
      { ...catalog[0], course: { ...catalog[0].course, id: 2, title: "Physics course", subject_name: "فيزياء" } },
      { ...catalog[0], course: { ...catalog[0].course, id: 3, title: "History course", subject_name: "تاريخ" } },
    ];
    render(<ExploreCourses {...props} catalog={moreCatalog} subjects={moreSubjects} />);
    await waitFor(() => expect(screen.queryByRole("heading", { name: "History course" })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "موادي الدراسية" })).toHaveClass("bg-ink");
    expect(screen.getByRole("heading", { name: "Physics course" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "كورس الرياضيات" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "كل المواد" }));
    expect(screen.getByRole("heading", { name: "History course" })).toBeInTheDocument();
  });

  it("goes back to page 1 when profile defaults arrive late", async () => {
    state.query = "page=2";
    const view = render(<ExploreCourses {...props} />);
    state.profile = { data: profile, isError: false };
    view.rerender(<NextIntlClientProvider locale="ar" messages={arMessages}><ExploreCourses {...props} /></NextIntlClientProvider>);
    await waitFor(() => expect(screen.getByText("Grade one - Science")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "كورس الرياضيات" })).toBeInTheDocument();
  });

  it("removes recommended courses while keeping the full course list", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
      <ExploreCourses
        catalog={catalog}
        teachers={[]}
        grades={[]}
        streams={[]}
        subjects={[]}
        loadError={false}
        locale="ar"
      />
      </NextIntlClientProvider>,
    );

    expect(screen.queryByRole("heading", { name: "مناسب لك" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "كل الكورسات" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "كورس الرياضيات" })).toBeInTheDocument();
  });

  it("keeps non-enrolled course cards inside the student dashboard shell", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
      <ExploreCourses
        catalog={catalog}
        teachers={[]}
        grades={[]}
        streams={[]}
        subjects={[]}
        loadError={false}
        locale="ar"
      />
      </NextIntlClientProvider>,
    );

    const cardLink = screen.getByRole("link", { name: "عرض كورس كورس الرياضيات" });
    expect(cardLink.getAttribute("href")).toBe(
      `/my-courses/1?teacher=${encodeURIComponent("ahmed")}`,
    );
  });
});
