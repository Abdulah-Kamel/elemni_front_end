import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticatedBackendFetch, sessionGate } = vi.hoisted(() => ({ authenticatedBackendFetch: vi.fn(), sessionGate: vi.fn() }));
vi.mock("@/src/lib/student-api/session", () => ({ authenticatedBackendFetch, sessionGate }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`REDIRECT ${path}`); } }));
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn(), getTranslations: vi.fn() }));
vi.mock("@/src/lib/student-api/public", () => ({
  getGrades: async () => ({ ok: true, data: [] }),
  getStreams: async () => ({ ok: true, data: [] }),
  getSubjects: async () => ({ ok: true, data: [] }),
}));
vi.mock("@/src/features/onboarding/components/onboarding-flow", () => ({ default: () => null }));

import OnboardingPage from "./page";

const empty = { phone_number: null, grade_id: null, stream_id: null, subject_ids: [] };
const me = { ok: true, data: { id: 7, phone_number: null } };

function page(locale = "ar", query: Record<string, string> = {}) {
  return OnboardingPage({ params: Promise.resolve({ locale }), searchParams: Promise.resolve(query) });
}

function backend(profile: unknown, user: unknown = me) {
  authenticatedBackendFetch.mockImplementation(async (path: string) => (path === "/api/v1/auth/me" ? user : profile));
}

describe("onboarding page", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sessionGate.mockResolvedValue("active");
  });

  it.each([["ar", "/dashboard"], ["en", "/en/dashboard"]])("sends a student who already chose a grade to the dashboard (%s)", async (locale, destination) => {
    backend({ ok: true, data: { ...empty, grade_id: 1 } });
    await expect(page(locale)).rejects.toThrow(`REDIRECT ${destination}`);
  });

  it("lets a student with a grade edit their answers with ?edit=1", async () => {
    const profile = { phone_number: "01000000000", grade_id: 1, stream_id: 2, subject_ids: [3] };
    backend({ ok: true, data: profile });
    const flow = await page("en", { edit: "1" });
    expect(flow.props.needsPhone).toBe(false);
    expect(flow.props.initialProfile).toEqual(profile);
  });

  it("asks for a phone when the backend profile has none", async () => {
    backend({ ok: true, data: empty });
    const flow = await page();
    expect(flow.props.needsPhone).toBe(true);
    expect(flow.props.ownerId).toBe(7);
    expect(authenticatedBackendFetch).toHaveBeenCalledWith("/api/v1/auth/me", { cache: "no-store" }, { refreshSession: false });
    expect(authenticatedBackendFetch).toHaveBeenCalledWith("/api/v1/students/me/profile", { cache: "no-store" }, { refreshSession: false });
  });

  it("keeps onboarding available when the profile can't be loaded", async () => {
    backend({ ok: false, error: { status: 503, code: "SERVICE_UNAVAILABLE" } });
    const flow = await page();
    expect(flow.props.needsPhone).toBe(true);
    expect(flow.props.initialProfile).toBeNull();
  });

  it("sends a rejected session through the refresh route, keeping the page to return to", async () => {
    backend({ ok: false, error: { status: 401, code: "SESSION_EXPIRED" } });
    await expect(page("en", { edit: "1" })).rejects.toThrow(`REDIRECT /api/student/auth/refresh?next=${encodeURIComponent("/en/onboarding?edit=1")}`);
  });

  it("sends a student without a session to login with next", async () => {
    sessionGate.mockResolvedValue("none");
    await expect(page("en")).rejects.toThrow(`REDIRECT /en/login?next=${encodeURIComponent("/en/onboarding")}`);
    await expect(page("ar")).rejects.toThrow(`REDIRECT /login?next=${encodeURIComponent("/onboarding")}`);
    expect(authenticatedBackendFetch).not.toHaveBeenCalled();
  });

  it("refreshes an expired access cookie before loading anything", async () => {
    sessionGate.mockResolvedValue("refresh");
    await expect(page()).rejects.toThrow(`REDIRECT /api/student/auth/refresh?next=${encodeURIComponent("/onboarding")}`);
    expect(authenticatedBackendFetch).not.toHaveBeenCalled();
  });
});
