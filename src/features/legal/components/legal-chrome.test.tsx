import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import LegalChrome from "@/src/features/legal/components/legal-chrome";

vi.mock("@/src/components/ui/motion-provider", () => ({
  MotionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/src/features/landing/components/client/navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("@/src/features/landing/components/server/footer", () => ({
  default: () => <div data-testid="footer" />,
}));

describe("LegalChrome", () => {
  afterEach(() => cleanup());

  it("uses left-to-right direction and the Latin font for English pages", () => {
    const { container } = render(
      <LegalChrome locale="en">
        <p>Terms</p>
      </LegalChrome>,
    );

    const shell = container.firstElementChild;
    expect(shell).toHaveAttribute("dir", "ltr");
    expect(shell).toHaveClass("font-[family-name:var(--font-inter)]");
  });
});
