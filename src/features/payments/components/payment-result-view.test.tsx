import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { parsePaymentResult } from "../parse-payment-result";
import PaymentResultView from "./payment-result-view";
import arMessages from "@/src/messages/ar.json";

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

function renderView(input: Record<string, string | string[] | undefined>) {
  const result = parsePaymentResult(input);
  render(
    <NextIntlClientProvider locale="ar" messages={arMessages}>
      <PaymentResultView result={result} />
    </NextIntlClientProvider>,
  );
  return result;
}

describe("PaymentResultView", () => {
  afterEach(() => {
    cleanup();
  });

  it("links a completed payment to the course only when the course id is valid", () => {
    renderView({ status: "completed", course_id: "12" });

    expect(screen.getByRole("link", { name: arMessages.paymentResult.actions.openCourse })).toHaveAttribute(
      "href",
      "/my-courses/12",
    );
  });

  it("does not link to a specific course when the course id is missing or invalid", () => {
    renderView({ status: "completed", course_id: "0" });

    expect(
      screen.queryByRole("link", { name: arMessages.paymentResult.actions.openCourse }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: arMessages.paymentResult.actions.myCourses })).toBeInTheDocument();
  });

  it("does not offer a course link for non-completed statuses", () => {
    renderView({ status: "pending", course_id: "12" });

    expect(
      screen.queryByRole("link", { name: arMessages.paymentResult.actions.openCourse }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: arMessages.paymentResult.actions.dashboard })).toBeInTheDocument();
  });

  it.each(
    (["completed", "failed", "pending", "cancelled", "refunded"] as const).map(
      (status) => ({ status }),
    ),
  )("renders distinct title copy for status $status", ({ status }) => {
    renderView({ status });

    expect(
      screen.getByRole("heading", { name: arMessages.paymentResult.title[status] }),
    ).toBeInTheDocument();
  });

  it("renders the unknown title for unrecognized statuses", () => {
    renderView({ status: "paid" });

    expect(
      screen.getByRole("heading", { name: arMessages.paymentResult.title.unknown }),
    ).toBeInTheDocument();
  });

  it("renders distinct copy per status without leaking sensitive values", () => {
    const result = renderView({
      status: "failed",
      signature: "secret-signature",
      cardDataToken: "secret-token",
    });

    expect(screen.getByRole("heading", { name: arMessages.paymentResult.title.failed })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("secret-signature");
    expect(document.body.textContent).not.toContain("secret-token");
    expect(result).not.toHaveProperty("signature");
  });

  it("omits missing details instead of rendering undefined", () => {
    renderView({ status: "pending" });

    expect(document.body.textContent).not.toContain("undefined");
  });
});
