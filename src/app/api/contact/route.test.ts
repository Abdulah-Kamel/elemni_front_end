import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validInput = {
  name: "Student Name",
  email: "student@example.com",
  phone: "01012345678",
  message: "Please help me with course access.",
  website: "",
};

async function postContact(input: unknown) {
  const { POST } = await import("./route");
  return POST(new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "198.51.100.22" },
    body: JSON.stringify(input),
  }));
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("EMAILJS_SERVICE_ID", "service-test");
    vi.stubEnv("EMAILJS_TEMPLATE_ID", "template-test");
    vi.stubEnv("EMAILJS_PUBLIC_KEY", "public-test");
    vi.stubEnv("EMAILJS_PRIVATE_KEY", "private-test");
    vi.stubEnv("CONTACT_FORM_TO", "support@example.com");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends valid contact details through EmailJS", async () => {
    const response = await postContact(validInput);

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith("https://api.emailjs.com/api/v1.0/email/send", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"to_email":"support@example.com"'),
    }));
  });

  it("rejects invalid contact details", async () => {
    const response = await postContact({ ...validInput, name: "A", email: "bad", message: "short" });

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a filled honeypot", async () => {
    const response = await postContact({ ...validInput, website: "bot" });

    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns not_configured when EmailJS credentials are missing", async () => {
    vi.stubEnv("EMAILJS_PRIVATE_KEY", "");
    vi.resetModules();

    const response = await postContact(validInput);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: "not_configured" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports EmailJS failures without claiming delivery", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("provider error", { status: 500 })));

    const response = await postContact(validInput);

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ code: "delivery_failed" });
  });

  it("limits requests to five per ten minutes for an IP", async () => {
    const responses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      responses.push(await postContact(validInput));
    }

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200, 200, 200, 429]);
  });
});
