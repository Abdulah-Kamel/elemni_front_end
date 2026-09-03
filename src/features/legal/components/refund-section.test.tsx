import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RefundSection } from "@/src/features/legal/components/refund-section";

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
    refund: {
      intro: "Refunds are available within 14 days.",
      eligibility: { title: "Eligibility", items: ["A", "B", "C"] },
      nonRefundable: {
        title: "Not eligible",
        items: ["A", "B", "C", "D"],
      },
      process: {
        title: "Process",
        steps: ["One", "Two", "Three", "Four"],
      },
      contact: "Call us for help.",
    },
  },
};

describe("RefundSection", () => {
  afterEach(() => cleanup());

  it("renders every non-refundable item when that section is opened", () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <RefundSection />
      </NextIntlClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Not eligible" }));

    expect(screen.getByText("D")).toBeInTheDocument();
  });
});
