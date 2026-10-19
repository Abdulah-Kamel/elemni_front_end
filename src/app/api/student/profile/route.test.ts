import { beforeEach, describe, expect, it, vi } from "vitest";

const { authenticatedBackendFetch } = vi.hoisted(() => ({ authenticatedBackendFetch: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/src/lib/student-api/session", () => ({ authenticatedBackendFetch }));

import { GET, PUT } from "./route";

const profile = { phone_number: null, grade_id: 1, stream_id: 2, subject_ids: [3] };
const put = (body: string) => PUT(new Request("http://localhost/api/student/profile", { method: "PUT", body }));

describe("student profile BFF", () => {
  beforeEach(() => vi.resetAllMocks());

  it("GET proxies the backend profile", async () => {
    authenticatedBackendFetch.mockResolvedValue({ ok: true, status: 200, data: profile });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(profile);
    expect(authenticatedBackendFetch).toHaveBeenCalledWith("/api/v1/students/me/profile", { cache: "no-store" });
  });

  it("PUT forwards a partial body with only the known fields", async () => {
    authenticatedBackendFetch.mockResolvedValue({ ok: true, status: 200, data: { ...profile, phone_number: "+201000000000" } });
    const response = await put(JSON.stringify({ phone_number: "+20 100 000 0000", role: "ADMIN" }));
    expect(await response.json()).toEqual({ ...profile, phone_number: "+201000000000" });
    expect(authenticatedBackendFetch).toHaveBeenCalledWith("/api/v1/students/me/profile", {
      method: "PUT",
      body: '{"phone_number":"+20 100 000 0000"}',
      cache: "no-store",
    });
  });

  it("PUT forwards the full study profile", async () => {
    authenticatedBackendFetch.mockResolvedValue({ ok: true, status: 200, data: profile });
    await put(JSON.stringify({ grade_id: 1, stream_id: 2, subject_ids: [3] }));
    expect(JSON.parse(authenticatedBackendFetch.mock.calls[0][1].body)).toEqual({ grade_id: 1, stream_id: 2, subject_ids: [3] });
  });

  it.each([401, 403, 422, 503])("passes backend %i through", async (status) => {
    authenticatedBackendFetch.mockResolvedValue({ ok: false, error: { status, code: "REJECTED", detail: "Rejected" } });
    for (const response of [await GET(), await put("{}")]) {
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ code: "REJECTED", detail: "Rejected" });
    }
  });

  it.each([
    ["malformed JSON", "{"],
    ["an array", "[]"],
    ["a numeric phone", '{"phone_number":1000000000}'],
    ["a string grade", '{"grade_id":"1"}'],
    ["a negative stream", '{"stream_id":-1}'],
    ["non-integer subjects", '{"subject_ids":[1.5]}'],
    ["subjects that are not a list", '{"subject_ids":3}'],
  ])("rejects %s without calling the backend", async (_name, body) => {
    const response = await put(body);
    expect(response.status).toBe(400);
    expect(authenticatedBackendFetch).not.toHaveBeenCalled();
  });
});
