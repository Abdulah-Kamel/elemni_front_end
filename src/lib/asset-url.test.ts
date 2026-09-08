import { describe, expect, it, vi } from "vitest";
import { resolveAssetUrl } from "./asset-url";

const fallback = "/images/fallback.webp";

describe("resolveAssetUrl", () => {
  it("returns the fallback for null", () => {
    expect(resolveAssetUrl(null, fallback)).toBe(fallback);
  });

  it("returns the fallback for undefined", () => {
    expect(resolveAssetUrl(undefined, fallback)).toBe(fallback);
  });

  it("returns the fallback for an empty string", () => {
    expect(resolveAssetUrl("", fallback)).toBe(fallback);
  });

  it("returns the fallback for a whitespace-only string", () => {
    expect(resolveAssetUrl("   ", fallback)).toBe(fallback);
  });

  it("preserves absolute https URLs", () => {
    const url = "https://cdn.example.com/courses/1.jpg";
    expect(resolveAssetUrl(url, fallback)).toBe(url);
  });

  it("preserves absolute http URLs", () => {
    const url = "http://localhost:8001/media/courses/1.jpg";
    expect(resolveAssetUrl(url, fallback)).toBe(url);
  });

  it("preserves root-relative paths", () => {
    const path = "/media/courses/1.jpg";
    expect(resolveAssetUrl(path, fallback)).toBe(path);
  });

  it("resolves storage keys against ASSETS_URL when available", () => {
    vi.stubEnv("ASSETS_URL", "https://cdn.example.com");
    expect(resolveAssetUrl("courses/7", fallback)).toBe(
      "https://cdn.example.com/courses/7",
    );
  });

  it("resolves storage keys with trailing slash on ASSETS_URL", () => {
    vi.stubEnv("ASSETS_URL", "https://cdn.example.com/");
    expect(resolveAssetUrl("courses/7", fallback)).toBe(
      "https://cdn.example.com/courses/7",
    );
  });

  it("returns fallback for storage keys when ASSETS_URL is not set", () => {
    vi.stubEnv("ASSETS_URL", undefined);
    expect(resolveAssetUrl("courses/7", fallback)).toBe(fallback);
  });

  it("trims whitespace before resolving", () => {
    vi.stubEnv("ASSETS_URL", "https://cdn.example.com");
    expect(resolveAssetUrl("  courses/7  ", fallback)).toBe(
      "https://cdn.example.com/courses/7",
    );
  });

  it("preserves absolute URLs even when ASSETS_URL is set", () => {
    vi.stubEnv("ASSETS_URL", "https://cdn.example.com");
    const url = "https://other-cdn.com/image.jpg";
    expect(resolveAssetUrl(url, fallback)).toBe(url);
  });
});
