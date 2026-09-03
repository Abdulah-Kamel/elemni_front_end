import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TermsAccordion } from "@/src/features/legal/components/terms-accordion";

vi.mock("motion/react", async () => {
  const React = await import("react");

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    m: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
        React.createElement("div", props, children),
    },
    useReducedMotion: () => true,
  };
});

const messages = {
  legal: {
    terms: {
      sections: [
        { heading: "1. Acceptance", content: "You accept these terms." },
        { heading: "2. Registration", content: "Keep your account secure." },
        { heading: "3. Enrollment", content: "Access follows payment." },
        { heading: "4. Pricing", content: "Prices are shown at checkout." },
        { heading: "5. Ownership", content: "Content remains protected." },
        { heading: "6. Conduct", content: "Use the platform lawfully." },
        { heading: "7. Liability", content: "Liability is limited by law." },
        { heading: "8. Governing law", content: "Egyptian law applies." },
      ],
    },
  },
};

describe("TermsAccordion", () => {
  afterEach(() => cleanup());

  it("renders the first and last terms sections", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TermsAccordion />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("button", { name: "1. Acceptance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "8. Governing law" })).toBeInTheDocument();
  });

  it("reveals the selected section content", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <TermsAccordion />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "8. Governing law" }));

    expect(screen.getByText("Egyptian law applies.")).toBeInTheDocument();
  });
});
