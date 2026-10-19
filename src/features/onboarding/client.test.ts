import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudentApiError } from "@/src/lib/student-api/client";
import {
  ONBOARDING_DRAFT_KEY,
  readOnboardingDraft,
  saveStudentOnboarding,
  saveStudentProfile,
  uploadDraftIfProfileEmpty,
} from "./client";

const study = { grade_id: 10, stream_id: 1, subject_ids: [100] };
const payload = { ...study, phone_number: "01000000000" };
const empty = { phone_number: null, grade_id: null, stream_id: null, subject_ids: [] };
const stored = () => JSON.parse(localStorage.getItem(ONBOARDING_DRAFT_KEY)!);
const fetchMock = vi.fn();

describe("onboarding profile persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("saves on the server and clears any device draft", async () => {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ version: 1, owner_id: 1, ...study }));
    fetchMock.mockResolvedValue(Response.json({ ...study, phone_number: "01000000000" }));
    await expect(saveStudentOnboarding(payload, 1)).resolves.toEqual({ ...study, phone_number: "01000000000" });
    expect(fetchMock).toHaveBeenCalledWith("/api/student/profile", expect.objectContaining({ method: "PUT", body: JSON.stringify(payload) }));
    expect(localStorage.getItem(ONBOARDING_DRAFT_KEY)).toBeNull();
  });

  it.each([
    ["network", () => Promise.reject(new TypeError("offline"))],
    ["server", () => Promise.resolve(Response.json({}, { status: 503 }))],
  ])("rethrows %s errors and keeps the choices for this student, without the phone", async (_name, failure) => {
    fetchMock.mockImplementation(failure);
    await expect(saveStudentOnboarding(payload, 1)).rejects.toBeInstanceOf(StudentApiError);
    expect(stored()).toEqual({ version: 1, owner_id: 1, ...study, completed_at: expect.any(String) });
    expect(stored()).not.toHaveProperty("phone_number");
    expect(readOnboardingDraft(1)).toEqual(study);
  });

  it.each([404, 422])("does not keep a draft when the backend rejects the profile with %i", async (status) => {
    fetchMock.mockResolvedValue(Response.json({ detail: "Rejected" }, { status }));
    await expect(saveStudentOnboarding(payload, 1)).rejects.toMatchObject({ status });
    expect(localStorage.getItem(ONBOARDING_DRAFT_KEY)).toBeNull();
  });

  it("does not read or write a draft without a known owner", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));
    await expect(saveStudentOnboarding(payload, undefined)).rejects.toBeDefined();
    expect(localStorage.getItem(ONBOARDING_DRAFT_KEY)).toBeNull();
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ version: 1, ...study }));
    expect(readOnboardingDraft(undefined)).toBeNull();
  });

  it("rejects even when browser storage is unavailable", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
    await expect(saveStudentOnboarding(payload, 1)).rejects.toBeInstanceOf(StudentApiError);
    spy.mockRestore();
  });

  it("saveStudentProfile sends partial fields and rejects backend errors", async () => {
    fetchMock.mockResolvedValue(Response.json({ detail: "Unknown subject" }, { status: 422 }));
    await expect(saveStudentProfile({ subject_ids: [] })).rejects.toMatchObject({ status: 422 });
    expect(fetchMock).toHaveBeenCalledWith("/api/student/profile", expect.objectContaining({ method: "PUT", body: '{"subject_ids":[]}' }));
  });

  it("does not hand one student's draft to another", async () => {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ version: 1, owner_id: 1, ...study }));
    expect(await uploadDraftIfProfileEmpty(empty, 2)).toEqual(empty);
    expect(readOnboardingDraft(2)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(readOnboardingDraft(1)).toEqual(study);
  });

  it("claims a draft saved before owners existed once, dropping the phone", async () => {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ version: 1, ...payload, completed_at: "yesterday" }));
    fetchMock.mockRejectedValue(new TypeError("offline"));
    await expect(uploadDraftIfProfileEmpty(empty, 1)).rejects.toBeDefined();
    expect(stored()).toEqual({ version: 1, owner_id: 1, ...study, completed_at: "yesterday" });
    expect(readOnboardingDraft(2)).toBeNull();
  });

  it("uploads the draft once when the backend profile is empty", async () => {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ version: 1, owner_id: 1, ...study }));
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({ ...empty, ...study })));
    expect(await uploadDraftIfProfileEmpty(empty, 1)).toEqual({ ...empty, ...study });
    expect(await uploadDraftIfProfileEmpty(empty, 1)).toEqual(empty);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(study);
    expect(localStorage.getItem(ONBOARDING_DRAFT_KEY)).toBeNull();
  });

  it("does not upload when the backend profile already has a grade", async () => {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ version: 1, owner_id: 1, ...study }));
    const saved = { ...empty, grade_id: 11, stream_id: 2, subject_ids: [] };
    expect(await uploadDraftIfProfileEmpty(saved, 1)).toEqual(saved);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(ONBOARDING_DRAFT_KEY)).not.toBeNull();
  });

  it("keeps the draft when the upload fails", async () => {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify({ version: 1, owner_id: 1, ...study }));
    fetchMock.mockRejectedValue(new TypeError("offline"));
    await expect(uploadDraftIfProfileEmpty(empty, 1)).rejects.toBeDefined();
    expect(readOnboardingDraft(1)).toEqual(study);
  });

  it("ignores malformed drafts without deleting them", () => {
    for (const raw of ["{", "null", "{}", '{"grade_id":1,"stream_id":2,"subject_ids":"bad"}']) {
      localStorage.setItem(ONBOARDING_DRAFT_KEY, raw);
      expect(readOnboardingDraft(1)).toBeNull();
      expect(localStorage.getItem(ONBOARDING_DRAFT_KEY)).toBe(raw);
    }
  });
});
