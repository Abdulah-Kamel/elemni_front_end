import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ONBOARDING_DRAFT_KEY, OnboardingSaveError, readOnboardingDraft, saveStudentOnboarding } from "./client";

const payload = { grade_id: 10, stream_id: 1, subject_ids: [100] };

describe("saveStudentOnboarding", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it("saves on the server and caches the draft", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(saveStudentOnboarding(payload)).resolves.toBe("saved");
    expect(fetchMock).toHaveBeenCalledWith("/api/student/profile", expect.objectContaining({ method: "PUT", body: JSON.stringify(payload) }));
    expect(readOnboardingDraft()).toMatchObject(payload);
  });

  it("keeps the choices on this device while the endpoint doesn't exist", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 404 })));
    await expect(saveStudentOnboarding(payload)).resolves.toBe("saved_locally");
    expect(JSON.parse(localStorage.getItem(ONBOARDING_DRAFT_KEY)!)).toMatchObject(payload);
  });

  it("throws on network and server errors without writing a draft", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(saveStudentOnboarding(payload)).rejects.toBeInstanceOf(OnboardingSaveError);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
    await expect(saveStudentOnboarding(payload)).rejects.toBeInstanceOf(OnboardingSaveError);
    expect(readOnboardingDraft()).toBeNull();
  });
});
