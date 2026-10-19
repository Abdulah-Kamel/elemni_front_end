import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudentQueryProvider from "@/src/components/providers/student-query-provider";
import { notifyStudentSessionChanged } from "@/src/lib/student-api/session-events";
import { useStudentProfile } from "./use-student-queries";

const DRAFT_KEY = "elemni-student-onboarding-v1";
const profile = { grade_id: 1, stream_id: 2, subject_ids: [3], phone_number: null };
const empty = { phone_number: null, grade_id: null, stream_id: null, subject_ids: [] };
const fetchMock = vi.fn();
const method = (init?: RequestInit) => init?.method ?? "GET";

describe("useStudentProfile", () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("uploads this student's draft when the backend profile is empty", async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, owner_id: 1, grade_id: 1, stream_id: 2, subject_ids: [3] }));
    fetchMock.mockResolvedValueOnce(Response.json(empty))
      .mockResolvedValueOnce(Response.json({ id: 1 }))
      .mockResolvedValueOnce(Response.json(profile));
    const { result } = renderHook(() => useStudentProfile(), { wrapper: StudentQueryProvider });
    await waitFor(() => expect(result.current.data).toEqual(profile));
    expect(fetchMock.mock.calls.map(([path, init]) => [path, method(init)])).toEqual([
      ["/api/student/profile", "GET"], ["/api/student/auth/me", "GET"], ["/api/student/profile", "PUT"],
    ]);
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("does not ask for the user when the profile already has a grade", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(Response.json(profile)));
    const { result } = renderHook(() => useStudentProfile(), { wrapper: StudentQueryProvider });
    await waitFor(() => expect(result.current.data).toEqual(profile));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([422, 503, "network"] as const)("returns the fetched profile when the draft upload fails with %s", async (failure) => {
    const draft = JSON.stringify({ version: 1, owner_id: 1, grade_id: 1, stream_id: 2, subject_ids: [3] });
    localStorage.setItem(DRAFT_KEY, draft);
    fetchMock.mockImplementation((path: string, init?: RequestInit) => {
      if (path === "/api/student/auth/me") return Promise.resolve(Response.json({ id: 1 }));
      if (method(init) !== "PUT") return Promise.resolve(Response.json(empty));
      if (failure === "network") return Promise.reject(new TypeError("offline"));
      return Promise.resolve(Response.json({ detail: "Failed" }, { status: failure }));
    });
    const { result } = renderHook(() => useStudentProfile(), { wrapper: StudentQueryProvider });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(empty);
    expect(localStorage.getItem(DRAFT_KEY)).toBe(failure === 422 ? null : draft);
    expect(fetchMock.mock.calls.filter(([, init]) => method(init) === "PUT")).toHaveLength(1);
  });

  it("does not upload another student's draft", async () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ owner_id: 1, grade_id: 1, stream_id: 2, subject_ids: [3] }));
    fetchMock.mockImplementation((path: string) => Promise.resolve(Response.json(path === "/api/student/auth/me" ? { id: 2 } : empty)));
    const { result } = renderHook(() => useStudentProfile(), { wrapper: StudentQueryProvider });
    await waitFor(() => expect(result.current.data).toEqual(empty));
    expect(fetchMock.mock.calls.some(([, init]) => method(init) === "PUT")).toBe(false);
  });

  it("clears the draft on logout", () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ owner_id: 1, ...profile }));
    renderHook(() => null, { wrapper: StudentQueryProvider });
    act(() => notifyStudentSessionChanged("logout"));
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("refreshes the profile when the session changes", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(Response.json(profile)));
    const { result } = renderHook(() => useStudentProfile(), { wrapper: StudentQueryProvider });
    await waitFor(() => expect(result.current.data).toEqual(profile));
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({ ...profile, grade_id: 9 })));
    act(() => notifyStudentSessionChanged("login"));
    await waitFor(() => expect(result.current.data?.grade_id).toBe(9));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reports unauthorized errors without retrying or deleting the draft", async () => {
    const draft = JSON.stringify({ version: 1, owner_id: 1, grade_id: 1, stream_id: 2, subject_ids: [3] });
    localStorage.setItem(DRAFT_KEY, draft);
    fetchMock.mockImplementation(() => Promise.resolve(Response.json({ detail: "Unauthorized" }, { status: 401 })));
    const { result } = renderHook(() => useStudentProfile(), { wrapper: StudentQueryProvider });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(DRAFT_KEY)).toBe(draft);
  });
});
