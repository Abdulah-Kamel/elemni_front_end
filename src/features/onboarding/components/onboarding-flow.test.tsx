import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OnboardingFlow from "./onboarding-flow";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: React.ComponentProps<"img"> & { fill?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={typeof src === "string" ? src : undefined}
      alt={alt ?? ""}
    />
  ),
}));

vi.mock("@/src/i18n/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("../client", () => ({
  saveStudentOnboarding: vi.fn(),
}));

describe("OnboardingFlow", () => {
  it("uses the sticker world tokens on the welcome step", () => {
    render(<OnboardingFlow grades={[]} streams={[]} subjects={[]} />);

    const shell = screen.getByText("أهلاً بيك في علمني").closest("[dir='rtl']");
    const primaryCta = screen.getByRole("button", { name: /ابدأ الآن/i });
    const skipButton = screen.getByRole("button", { name: /تخطي الآن/i });
    const title = screen.getByRole("heading", { name: "أهلاً بيك في علمني" });

    expect(shell).toHaveClass("student-portal-shell", "text-ink");
    expect(title).toHaveClass("text-brand-700");
    expect(primaryCta).toHaveClass("sticker-btn");
    expect(skipButton).toHaveClass("text-brand-700");
  });
});
