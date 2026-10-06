import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  refreshAccessToken: vi.fn(),
  clearSession: vi.fn(),
  sessionGate: vi.fn(),
  authenticatedBackendFetch: vi.fn(),
  publicFetch: vi.fn(),
}));

vi.mock("@/src/lib/student-api/session", () => mocks);
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
  notFound: () => { throw new Error("not found"); },
}));
vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/src/lib/student-api/public", () => ({
  getGrades: mocks.publicFetch,
  getStreams: mocks.publicFetch,
  getSubjects: mocks.publicFetch,
  getPublicCourses: mocks.publicFetch,
  getPublicTeachers: mocks.publicFetch,
  getPublicTeacher: mocks.publicFetch,
  getPublicTeacherCourses: mocks.publicFetch,
}));
vi.mock("@/src/features/dashboard/components/student-dashboard", () => ({ default: () => null }));
vi.mock("@/src/features/onboarding/components/onboarding-flow", () => ({ default: () => null }));
vi.mock("@/src/features/dashboard/components/my-courses", () => ({ default: () => null }));
vi.mock("@/src/features/courses/components/course-detail", () => ({ default: () => null }));
vi.mock("@/src/features/courses/components/explore-courses", () => ({ default: () => null }));
vi.mock("@/src/features/teachers/components/client/explore-teachers", () => ({ default: () => null }));
vi.mock("@/src/features/teachers/components/client/dashboard-teacher-profile", () => ({ default: () => null }));
vi.mock("@/src/features/portal/components/portal-shell", () => ({ default: () => null }));
vi.mock("@/src/features/payments/components/payment-result-view", () => ({ default: () => null }));
vi.mock("@/src/lib/student-api/adapters", () => ({ toTeacher: () => ({}) }));

const request = (next?: string) => new Request(
  `https://elemni.test/api/student/auth/refresh${next === undefined ? "" : `?next=${encodeURIComponent(next)}`}`,
);

beforeEach(() => {
  mocks.refreshAccessToken.mockReset();
  mocks.refreshAccessToken.mockResolvedValue({ access_token: "fresh-access", refresh_token: "fresh-refresh" });
  mocks.clearSession.mockReset();
  mocks.clearSession.mockResolvedValue(undefined);
  mocks.sessionGate.mockReset();
  mocks.sessionGate.mockResolvedValue("refresh");
  mocks.authenticatedBackendFetch.mockReset();
  mocks.authenticatedBackendFetch.mockResolvedValue({ ok: true, data: { id: 1 } });
  mocks.publicFetch.mockReset();
  mocks.publicFetch.mockResolvedValue({ ok: true, data: [] });
});

describe("GET auth refresh", () => {
  it("refreshes and redirects to next with its query", async () => {
    const { GET } = await import("./route");
    const response = await GET(request("/my-courses/53?teacher=ahmed&item=101"));
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/my-courses/53?teacher=ahmed&item=101");
    expect(mocks.refreshAccessToken).toHaveBeenCalledOnce();
    expect(mocks.clearSession).not.toHaveBeenCalled();
  });

  it("clears the session and redirects to login when refresh fails", async () => {
    const { GET } = await import("./route");
    mocks.refreshAccessToken.mockResolvedValue(null);
    const response = await GET(request("/my-courses/53?item=101"));
    expect(response.status).toBe(302);
    expect(mocks.clearSession).toHaveBeenCalledOnce();
    expect(response.headers.get("Location")).toBe("/login?next=%2Fmy-courses%2F53%3Fitem%3D101");
  });

  it("keeps the English login prefix when refresh fails", async () => {
    const { GET } = await import("./route");
    mocks.refreshAccessToken.mockResolvedValue(null);
    const response = await GET(request("/en/my-courses/53?item=101"));
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/en/login?next=%2Fen%2Fmy-courses%2F53%3Fitem%3D101");
    expect(mocks.clearSession).toHaveBeenCalledOnce();
  });

  it.each([undefined, "", "dashboard", "https://evil.com", "//evil.com", "/\\evil.com"])("falls back to dashboard for next=%s", async (next) => {
    const { GET } = await import("./route");
    const response = await GET(request(next));
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/dashboard");
  });
});

describe("refresh-only page requests", () => {
  const pages = [
    { name: "dashboard", load: () => import("../../../../[locale]/dashboard/page"), path: "/dashboard?from=tile" },
    { name: "onboarding", load: () => import("../../../../[locale]/onboarding/page"), path: "/onboarding?from=tile" },
    { name: "my courses", load: () => import("../../../../[locale]/my-courses/page"), path: "/my-courses?from=tile" },
    { name: "course detail", load: () => import("../../../../[locale]/my-courses/[courseId]/page"), path: "/my-courses/53?teacher=ahmed&item=101" },
    { name: "explore", load: () => import("../../../../[locale]/explore/page"), path: "/explore?from=tile" },
    { name: "teachers", load: () => import("../../../../[locale]/explore/teachers/page"), path: "/explore/teachers?from=tile" },
    { name: "teacher profile", load: () => import("../../../../[locale]/explore/teachers/[id]/page"), path: "/explore/teachers/ahmed?from=tile" },
    { name: "payment result", load: () => import("../../../../[locale]/payment/redirect/page"), path: "/payment/redirect?success=true&tag=a&tag=b" },
  ];

  it.each(pages)("$name redirects before any authenticated fetch, preserving locale and query", async ({ load, path }) => {
    const { default: page } = await load();
    const query = path.includes("payment")
      ? { success: "true", tag: ["a", "b"] }
      : path.includes("/53") ? { teacher: " ahmed ", item: "101" } : { from: "tile" };
    for (const locale of ["ar", "en"]) {
      const next = locale === "ar" ? path : `/en${path}`;
      await expect(page({
        params: Promise.resolve({ locale, courseId: "53", id: "ahmed" }),
        searchParams: Promise.resolve(query),
      })).rejects.toThrow(`redirect:/api/student/auth/refresh?next=${encodeURIComponent(next)}`);
    }
    expect(mocks.authenticatedBackendFetch).not.toHaveBeenCalled();
    expect(mocks.publicFetch).not.toHaveBeenCalled();
  });

  it("keeps anonymous payment results public without an authenticated fetch", async () => {
    mocks.sessionGate.mockResolvedValue("none");
    const { default: page } = await import("../../../../[locale]/payment/redirect/page");
    const element = await page({ params: Promise.resolve({ locale: "ar" }), searchParams: Promise.resolve({ success: "true" }) });
    expect(element.props.user).toBeNull();
    expect(mocks.authenticatedBackendFetch).not.toHaveBeenCalled();
  });
});
