import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./safe-return-to";

describe("safeReturnTo", () => {
  it.each([undefined, "", "dashboard", "https://evil.com", "//evil.com", "/\\evil.com", "/path\\evil.com", "/\n/evil.com", "/\t/evil.com"])("rejects %j", (value) => {
    expect(safeReturnTo(value)).toBeUndefined();
  });
  it("rejects a repeated next parameter", () => {
    expect(safeReturnTo(["/dashboard", "/explore"])).toBeUndefined();
  });
  it.each(["/dashboard", "/courses/1?x=y", "/", "/en/onboarding", "/my-courses/7?item=3"])("allows %s", (value) => {
    expect(safeReturnTo(value)).toBe(value);
  });
});
