import { describe, expect, it } from "vitest";
import { parseAppDownloadUrl } from "./app-download-url";

describe("parseAppDownloadUrl", () => {
  it("accepts an https link", () => {
    expect(parseAppDownloadUrl(" https://elemni.b-cdn.net/app/elemni-android.apk ")).toBe(
      "https://elemni.b-cdn.net/app/elemni-android.apk",
    );
  });

  it.each([undefined, "", "   ", "not a url", "http://elemni.b-cdn.net/app.apk", "javascript:alert(1)"])(
    "rejects %p",
    (value) => {
      expect(parseAppDownloadUrl(value)).toBeNull();
    },
  );
});
