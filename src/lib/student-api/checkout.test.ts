import { describe, expect, it } from "vitest";

import { isCheckoutRedirectDto, resolveCheckoutRedirect } from "./checkout";

describe("resolveCheckoutRedirect", () => {
  it("leaves absolute Kashier URLs unchanged", () => {
    expect(
      resolveCheckoutRedirect("https://checkout.kashier.io/session/abc123", "ar"),
    ).toBe("https://checkout.kashier.io/session/abc123");
    expect(
      resolveCheckoutRedirect("https://checkout.kashier.io/session/abc123", "en"),
    ).toBe("https://checkout.kashier.io/session/abc123");
  });

  it("keeps relative backend redirects on the default Arabic route", () => {
    expect(resolveCheckoutRedirect("/my-courses", "ar")).toBe("/my-courses");
  });

  it("localizes relative backend redirects for English", () => {
    expect(resolveCheckoutRedirect("/my-courses", "en")).toBe("/en/my-courses");
  });

  it("does not double-prefix an already localized path", () => {
    expect(resolveCheckoutRedirect("/en/my-courses", "en")).toBe("/en/my-courses");
  });
});

describe("isCheckoutRedirectDto", () => {
  it("accepts Kashier absolute URLs and free-course app redirects", () => {
    expect(
      isCheckoutRedirectDto({
        redirect_url: "https://checkout.kashier.io/session/abc123",
      }),
    ).toBe(true);
    expect(isCheckoutRedirectDto({ redirect_url: "/my-courses" })).toBe(true);
  });

  it("rejects non-web schemes from the backend payment redirect", () => {
    expect(isCheckoutRedirectDto({ redirect_url: "javascript:alert(1)" })).toBe(false);
  });
});
