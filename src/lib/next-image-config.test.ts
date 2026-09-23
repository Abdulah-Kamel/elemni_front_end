import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("Next image configuration", () => {
  it("allows signed query strings from the Bunny course image CDN", () => {
    const remotePatterns = nextConfig.images?.remotePatterns ?? [];
    const bunnyPattern = remotePatterns.find((pattern) => {
      const hostname = pattern instanceof URL ? pattern.hostname : pattern.hostname;
      return hostname === "elemni.b-cdn.net";
    });

    expect(bunnyPattern).toBeDefined();
    expect(bunnyPattern).not.toBeInstanceOf(URL);
    expect(bunnyPattern).not.toHaveProperty("search");
  });
});
