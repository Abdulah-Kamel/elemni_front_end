import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StudentCourseDetailDto } from "@/src/lib/student-api/contract";
import arMessages from "@/src/messages/ar.json";
import enMessages from "@/src/messages/en.json";
import CourseDetail from "./course-detail";

vi.mock("@/src/features/portal/components/portal-shell", () => ({
  default: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title?: string;
  }) => (
    <div>
      <header aria-label="Portal topbar">{title}</header>
      {children}
    </div>
  ),
}));

vi.mock("./public-course-detail-shell", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="public-course-detail-shell">{children}</div>
  ),
}));

vi.mock("@/src/components/ui/global-loading", () => ({
  GlobalLoading: () => <div>loading</div>,
}));

vi.mock("@/src/features/courses/video/video-lesson", () => ({
  default: ({ item, lesson }: { item: { id: number; title: string }; lesson: { title: string } }) => (
    <div data-testid="video-lesson" data-item-id={item.id} title={`${lesson.title} - ${item.title}`} />
  ),
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
              has_document: true,
              has_exam: false,
              bunny_stream_embed_url: null,
              document_path: "https://cdn.elemni.test/lesson.pdf",
              exam_id: null,
            },
            {
              id: 102,
              title: "ملخص الدرس",
              order: 2,
              duration_minutes: null,
              has_video: false,
              has_document: true,
              has_exam: false,
              bunny_stream_embed_url: null,
              document_path: "courses/12/lessons/11/items/102.pdf",
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
    progress: {
      completion_percent: 0,
      completed_item_ids: [],
      last_item_id: null,
      last_lesson_id: null,
      next_item_id: 101,
      next_lesson_id: 11,
      last_opened_at: null,
    },
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
    vi.unstubAllEnvs();
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
    ).toHaveAttribute("data-item-id", "101");
    expect(screen.getByLabelText("Portal topbar")).toHaveTextContent(
      "كورس التفاضل",
    );
    const curriculumSidebar = screen.getByTestId("learner-curriculum-sidebar");
    expect(curriculumSidebar).toHaveAttribute("aria-label", "منهج الكورس");
    expect(curriculumSidebar).toHaveAttribute("data-layout", "flat");
    expect(curriculumSidebar).not.toHaveClass("overflow-y-auto");
    expect(curriculumSidebar).not.toHaveClass("lg:max-h-[calc(100dvh-7rem)]");
    const curriculumItem = screen.getByTestId("learner-curriculum-item-101");
    expect(curriculumItem).toHaveClass("w-full", "rounded-none");
    expect(screen.queryByText("السعر المستحق")).not.toBeInTheDocument();

    const player = document.querySelector("#course-player");
    const title = screen.getByRole("heading", { name: "كورس التفاضل" });
    const curriculum = screen.getByTestId("learner-curriculum-sidebar");

    expect(player).not.toBeNull();
    if (!player) throw new Error("expected #course-player to exist");

    expect(title.compareDocumentPosition(player) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(title.compareDocumentPosition(curriculum) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  async function renderEnrolledCourseDetail() {
    fetchMock.mockImplementation((input: string | URL) => {
      const url = String(input);

      if (url.startsWith("/api/student/my-courses/12")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => detail });
      }

      if (url === "/api/student/auth/me") {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: 1, name: "الطالب" }) });
      }

      return Promise.resolve({ ok: false, status: 404, json: async () => ({ detail: "not found" }) });
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

    await screen.findByTitle("مقدمة في النهايات - فيديو الشرح");
  }

  it("keeps the lesson title above the player and course summary beneath the curriculum", async () => {
    await renderEnrolledCourseDetail();

    const enrolledLayout = document.querySelector("[data-enrolled-layout]");
    const player = document.querySelector("#course-player");
    const title = screen.getByRole("heading", { name: "كورس التفاضل" });
    const curriculumSidebar = screen.getByTestId("learner-curriculum-sidebar");

    expect(enrolledLayout).not.toBeNull();
    expect(player).not.toBeNull();
    if (!enrolledLayout || !player) {
      throw new Error("expected enrolled layout and player to exist");
    }

    expect(enrolledLayout).toHaveClass("lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]");
    expect(enrolledLayout).toContainElement(player as HTMLElement);
    expect(enrolledLayout).toContainElement(curriculumSidebar);

    const playerColumn = player.closest("[data-enrolled-layout] > div");
    expect(playerColumn).not.toBeNull();
    if (!playerColumn) throw new Error("expected player column inside enrolled layout");
    expect(playerColumn).toContainElement(title);
    expect(playerColumn).not.toContainElement(curriculumSidebar);

    expect(
      title.compareDocumentPosition(player) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      title.compareDocumentPosition(curriculumSidebar) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: arMessages.courseDetail.enterTheaterMode }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles theater mode on and off with layout changes", async () => {
    await renderEnrolledCourseDetail();

    const enrolledLayout = document.querySelector("[data-enrolled-layout]");
    const player = document.querySelector("#course-player");
    const theaterButton = screen.getByRole("button", {
      name: arMessages.courseDetail.enterTheaterMode,
    });
    const follows = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

    expect(player).not.toBeNull();
    if (!player) throw new Error("expected #course-player to exist");

    const titleOff = screen.getByRole("heading", { name: "كورس التفاضل" });
    const curriculumOff = screen.getByTestId("learner-curriculum-sidebar");
    expect(follows(titleOff, player)).toBeTruthy();
    expect(follows(titleOff, curriculumOff)).toBeTruthy();
    const courseSummaryOff = screen.getByRole("region", {
      name: arMessages.courseDetail.courseLabel,
    });
    expect(curriculumOff.parentElement).toContainElement(courseSummaryOff);

    fireEvent.click(theaterButton);
    expect(theaterButton).toHaveAttribute("aria-pressed", "true");
    expect(enrolledLayout).toHaveClass("lg:grid-cols-1");
    const titleOn = screen.getByRole("heading", { name: "كورس التفاضل" });
    const curriculumOn = screen.getByTestId("learner-curriculum-sidebar");
    expect(enrolledLayout).toContainElement(player as HTMLElement);
    expect(enrolledLayout).toContainElement(curriculumOn);
    expect(enrolledLayout).toContainElement(titleOn);
    expect(curriculumOn).toHaveAttribute("data-layout", "stacked");
    expect(follows(player, curriculumOn)).toBeTruthy();
    expect(follows(titleOn, player)).toBeTruthy();
    const courseSummaryOn = screen.getByRole("region", {
      name: arMessages.courseDetail.courseLabel,
    });
    expect(curriculumOn.parentElement).toContainElement(courseSummaryOn);
    expect(document.querySelector("#course-player")).toBe(player);
    expect(player.closest("[data-enrolled-layout] > div")).toContainElement(titleOn);

    fireEvent.click(theaterButton);
    expect(theaterButton).toHaveAttribute("aria-pressed", "false");
    expect(enrolledLayout).toHaveClass("lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]");
    const titleRestored = screen.getByRole("heading", { name: "كورس التفاضل" });
    const curriculumRestored = screen.getByTestId("learner-curriculum-sidebar");
    expect(curriculumRestored).toHaveAttribute("data-layout", "flat");
    expect(enrolledLayout).toContainElement(player as HTMLElement);
    expect(follows(titleRestored, player)).toBeTruthy();
    expect(follows(titleRestored, curriculumRestored)).toBeTruthy();
    expect(document.querySelector("#course-player")).toBe(player);
    expect(player.closest("[data-enrolled-layout] > div")).toContainElement(titleRestored);
    expect(player.closest("[data-enrolled-layout] > div")).not.toContainElement(curriculumRestored);
  });

  it("previews an enrolled PDF in the learning viewer with a download action", async () => {
    vi.stubEnv("ASSETS_URL", "https://cdn.elemni.test");
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
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

    await screen.findByTitle("مقدمة في النهايات - فيديو الشرح");
    const theaterButton = screen.getByRole("button", {
      name: arMessages.courseDetail.enterTheaterMode,
    });
    fireEvent.click(theaterButton);
    expect(theaterButton).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector("[data-enrolled-layout]")).toHaveClass("lg:grid-cols-1");

    fireEvent.click(await screen.findByTestId("learner-curriculum-item-102"));

    const preview = await screen.findByTitle("مقدمة في النهايات - ملخص الدرس");
    expect(preview).toHaveAttribute("src", "https://cdn.elemni.test/courses/12/lessons/11/items/102.pdf");
    expect(screen.getByRole("link", { name: "تحميل الملف" })).toHaveAttribute(
      "href",
      "https://cdn.elemni.test/courses/12/lessons/11/items/102.pdf",
    );
    expect(document.querySelector("[data-enrolled-layout]")).toHaveClass("lg:grid-cols-1");

    const playerAfterSwitch = document.querySelector("#course-player");
    const curriculumAfterSwitch = screen.getByTestId("learner-curriculum-sidebar");
    const titleAfterSwitch = screen.getByRole("heading", { name: "كورس التفاضل" });
    expect(playerAfterSwitch).not.toBeNull();
    if (!playerAfterSwitch) throw new Error("expected #course-player to exist");
    expect(
      playerAfterSwitch.compareDocumentPosition(curriculumAfterSwitch) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      titleAfterSwitch.compareDocumentPosition(playerAfterSwitch) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("keeps video and document actions available for a mixed-content item", async () => {
    fetchMock.mockImplementation((input: string | URL) => {
      const url = String(input);

      if (url.startsWith("/api/student/my-courses/12")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => detail });
      }

      if (url === "/api/student/auth/me") {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: 1, name: "الطالب" }) });
      }

      return Promise.resolve({ ok: false, status: 404, json: async () => ({ detail: "not found" }) });
    });

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <QueryClientProvider client={queryClient}>
          <CourseDetail courseId={12} teacherSlug="ahmad-ali" grades={[]} streams={[]} />
        </QueryClientProvider>
      </NextIntlClientProvider>,
    );

    await screen.findByTitle("مقدمة في النهايات - فيديو الشرح");
    const item = screen.getByTestId("learner-curriculum-item-101");
    const resources = within(item).getByRole("list", { name: "موارد العنصر" });
    expect(resources).toBeInTheDocument();
    expect(within(item).getByRole("button", { name: "عرض الملف" })).toBeInTheDocument();
    expect(within(item).getByRole("button", { name: "تشغيل الفيديو" })).toBeInTheDocument();
    const collapseButton = within(item).getByRole("button", { name: "طي موارد العنصر" });
    fireEvent.click(collapseButton);
    expect(within(item).queryByRole("list", { name: "موارد العنصر" })).not.toBeInTheDocument();
    fireEvent.click(within(item).getByRole("button", { name: "فتح موارد العنصر" }));
    expect(within(item).getByRole("list", { name: "موارد العنصر" })).toBeInTheDocument();
    fireEvent.click(within(item).getByRole("button", { name: "عرض الملف" }));
    expect(await screen.findByTitle("مقدمة في النهايات - فيديو الشرح")).toHaveAttribute(
      "src",
      "https://cdn.elemni.test/lesson.pdf",
    );
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
            publicMode
            grades={[{ id: 3, name: "الصف الثالث الثانوي", level: "secondary" }]}
            streams={[{ id: 1, name: "علمي علوم", slug: "science" }]}
          />
        </QueryClientProvider>
      </NextIntlClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "كورس التفاضل" })).toBeInTheDocument();
    expect(screen.getByTestId("public-course-detail-shell")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "اشترك في الكورس" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "الوحدة الأولى" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /مقدمة في النهايات/ })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "محتوى الكورس" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("learner-curriculum-sidebar")).not.toBeInTheDocument();
    expect(document.querySelector("#course-player")).toBeNull();
    expect(screen.getByRole("button", { name: "اشترك في الكورس" })).toBeInTheDocument();
    expect(screen.queryByText(/Kashier/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: arMessages.courseDetail.enterTheaterMode }),
    ).not.toBeInTheDocument();
    expect(document.querySelector("[data-enrolled-layout]")).toBeNull();
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
          json: async () => ({ redirect_url: "https://checkout.kashier.io/session/test123" }),
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
    expect(screen.getByText(/EGP\s+250/)).toBeInTheDocument();
  });

  describe("checkout redirect handling", () => {
    const originalLocation = Object.getOwnPropertyDescriptor(window, "location");
    const assignMock = vi.fn();

    beforeEach(() => {
      assignMock.mockClear();
      Object.defineProperty(window, "location", {
        configurable: true,
        value: {
          assign: assignMock,
          pathname: "/courses/12",
          search: "",
          href: "http://localhost/courses/12",
          origin: "http://localhost",
        },
      });
    });

    afterEach(() => {
      if (originalLocation) Object.defineProperty(window, "location", originalLocation);
    });

    async function confirmCheckout(options: {
      locale: "ar" | "en";
      redirectUrl: string;
      subscribeLabel: string;
      confirmLabel: string;
    }) {
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
            json: async () => ({ redirect_url: options.redirectUrl }),
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
        <NextIntlClientProvider
          locale={options.locale}
          messages={options.locale === "ar" ? arMessages : enMessages}
        >
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

      await screen.findByRole("button", { name: options.subscribeLabel });
      fireEvent.click(screen.getAllByRole("button", { name: options.subscribeLabel })[0]);
      await screen.findByRole("dialog");
      fireEvent.click(screen.getByRole("button", { name: options.confirmLabel }));
      await waitFor(() => expect(assignMock).toHaveBeenCalledTimes(1));
    }

    it("sends paid checkout to the Kashier URL unchanged", async () => {
      await confirmCheckout({
        locale: "ar",
        redirectUrl: "https://checkout.kashier.io/session/test123",
        subscribeLabel: "اشترك في الكورس",
        confirmLabel: "المتابعة إلى الدفع",
      });

      expect(assignMock).toHaveBeenCalledWith(
        "https://checkout.kashier.io/session/test123",
      );
    });

    it("keeps the free-course redirect on the Arabic in-app route", async () => {
      await confirmCheckout({
        locale: "ar",
        redirectUrl: "/my-courses",
        subscribeLabel: "اشترك في الكورس",
        confirmLabel: "المتابعة إلى الدفع",
      });

      expect(assignMock).toHaveBeenCalledWith("/my-courses");
    });

    it("localizes the free-course redirect to the English in-app route", async () => {
      await confirmCheckout({
        locale: "en",
        redirectUrl: "/my-courses",
        subscribeLabel: "Enroll in this course",
        confirmLabel: "Continue to payment",
      });

      expect(assignMock).toHaveBeenCalledWith("/en/my-courses");
    });
  });
});

describe("CourseDetail video analytics integration", () => {
  const videoItem = (id: number, title: string, extra: Partial<StudentCourseDetailDto["course"]["chapters"][number]["lessons"][number]["items"][number]> = {}) => ({
    id, title, order: id, duration_minutes: 10, duration_seconds: 600,
    has_video: true, has_document: false, has_exam: false,
    bunny_stream_embed_url: null, document_path: null, exam_id: null, ...extra,
  });

  function fixtureWith(
    items: StudentCourseDetailDto["course"]["chapters"][number]["lessons"][number]["items"],
    progress: Partial<NonNullable<StudentCourseDetailDto["enrollment"]>["progress"]> = {},
  ): StudentCourseDetailDto {
    const lesson = { ...course.chapters[0].lessons[0], items };
    const nextCourse = { ...course, chapters: [{ ...course.chapters[0], lessons: [lesson] }] };
    const enrollment = detail.enrollment!;
    return {
      ...detail,
      course: nextCourse,
      enrollment: { ...enrollment, course: nextCourse, progress: { ...enrollment.progress, ...progress } },
    };
  }

  function renderWith(fixture: StudentCourseDetailDto, props: { initialItemId?: number } = {}) {
    fetchMock.mockImplementation((input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "/api/student/my-courses/12/progress" && init?.method === "PUT") {
        return Promise.resolve({ ok: true, status: 200, json: async () => fixture.enrollment?.progress });
      }
      if (url.startsWith("/api/student/my-courses/12")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => fixture });
      }
      if (url === "/api/student/auth/me") {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ id: 1, name: "الطالب" }) });
      }
      return Promise.resolve({ ok: false, status: 404, json: async () => ({ detail: "not found" }) });
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <QueryClientProvider client={queryClient}>
          <CourseDetail courseId={12} teacherSlug="ahmad-ali" grades={[]} streams={[]} {...props} />
        </QueryClientProvider>
      </NextIntlClientProvider>,
    );
    return { queryClient };
  }

  const progressPuts = () =>
    fetchMock.mock.calls.filter(([url, init]) =>
      String(url) === "/api/student/my-courses/12/progress" && (init as RequestInit | undefined)?.method === "PUT");

  beforeEach(() => {
    vi.stubEnv("ASSETS_URL", "https://cdn.elemni.test");
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it("treats has_video items as playable even without an embed URL", async () => {
    renderWith(fixtureWith([videoItem(201, "الدرس أ")], { next_item_id: 201 }));
    expect(await screen.findByTestId("video-lesson")).toHaveAttribute("data-item-id", "201");
  });

  it("does not send a progress PUT when opening a video", async () => {
    renderWith(fixtureWith([videoItem(201, "الدرس أ"), videoItem(202, "الدرس ب")], { next_item_id: 201 }));
    await screen.findByTestId("video-lesson");
    fireEvent.click(screen.getByTestId("learner-curriculum-item-202"));
    await waitFor(() => expect(screen.getByTestId("video-lesson")).toHaveAttribute("data-item-id", "202"));
    expect(progressPuts()).toHaveLength(0);
  });

  it("document open on a video item sends no progress PUT", async () => {
    renderWith(detail);
    await screen.findByTestId("video-lesson");
    const item = screen.getByTestId("learner-curriculum-item-101");
    fireEvent.click(within(item).getByRole("button", { name: "عرض الملف" }));
    await waitFor(() =>
      expect(document.querySelector('iframe[src="https://cdn.elemni.test/lesson.pdf"]')).not.toBeNull());
    expect(progressPuts()).toHaveLength(0);
  });

  it("marks a document-only item complete on open", async () => {
    renderWith(detail);
    await screen.findByTestId("video-lesson");
    fireEvent.click(screen.getByTestId("learner-curriculum-item-102"));
    await waitFor(() => expect(progressPuts()).toHaveLength(1));
    expect((progressPuts()[0][1] as RequestInit).body).toBe(JSON.stringify({ item_id: 102, completed: true }));
  });

  it("keeps the selected item after progress refetch", async () => {
    const { queryClient } = renderWith(
      fixtureWith([videoItem(201, "الدرس أ"), videoItem(202, "الدرس ب")], { next_item_id: 201 }),
    );
    expect(await screen.findByTestId("video-lesson")).toHaveAttribute("data-item-id", "201");
    act(() => {
      queryClient.setQueriesData<StudentCourseDetailDto>({ queryKey: ["student", "course", 12] }, (current) =>
        current?.enrollment
          ? { ...current, enrollment: { ...current.enrollment, progress: { ...current.enrollment.progress, next_item_id: 202 } } }
          : current);
    });
    expect(screen.getByTestId("video-lesson")).toHaveAttribute("data-item-id", "201");
  });

  it("opens the deep-linked item first", async () => {
    renderWith(fixtureWith([videoItem(201, "الدرس أ"), videoItem(202, "الدرس ب")], { next_item_id: 201 }), { initialItemId: 202 });
    expect(await screen.findByTestId("video-lesson")).toHaveAttribute("data-item-id", "202");
  });

  it("shows a position bar for a partially watched video and counts video completion", async () => {
    renderWith(fixtureWith([videoItem(201, "الدرس أ"), videoItem(202, "الدرس ب")], {
      next_item_id: 201,
      completed_item_ids: [],
      video_progress: [
        { item_id: 201, last_position_sec: 290, watched_percent: 48, is_completed: false },
        { item_id: 202, last_position_sec: 600, watched_percent: 100, is_completed: true },
      ],
    }));
    await screen.findByTestId("video-lesson");
    expect(within(screen.getByTestId("learner-curriculum-item-201")).getByRole("progressbar"))
      .toHaveAttribute("aria-valuenow", "48");
    expect(within(screen.getByTestId("learner-curriculum-item-202")).getByText(arMessages.courseDetail.completedStatus))
      .toBeInTheDocument();
  });
});
