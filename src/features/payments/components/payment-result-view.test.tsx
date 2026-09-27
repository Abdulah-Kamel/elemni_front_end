import { cleanup, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { parsePaymentResult } from "../parse-payment-result";
import PaymentResultView from "./payment-result-view";
import arMessages from "@/src/messages/ar.json";

const { mockUseMyCourses } = vi.hoisted(() => ({ mockUseMyCourses: vi.fn() }));

vi.mock("@/src/features/student/hooks/use-student-queries", () => ({
  useMyCourses: mockUseMyCourses,
}));
vi.mock("@/src/lib/student-api/client", () => ({
  isStudentUnauthorized: (error: unknown) => Boolean(error && typeof error === "object" && "status" in error && error.status === 401),
}));

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
  beforeEach(() => {
    mockUseMyCourses.mockReturnValue({ data: { items: [] }, isLoading: false, error: null, refetch: vi.fn() });
  });

  afterEach(() => {
    cleanup();
    mockUseMyCourses.mockReset();
    mockUseMyCourses.mockReturnValue({ data: { items: [] }, isLoading: false, error: null, refetch: vi.fn() });
  });

  it("confirms and links a completed payment only when the backend reports an enrollment", () => {
    mockUseMyCourses.mockReturnValue({
      data: { items: [{ course_id: 12, total_paid: "250.00", currency: "EGP", course: { title: "Physics" } }] },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderView({ status: "completed", course_id: "12", amount: "1.00", order_id: "FAKE" });

    expect(screen.getByRole("link", { name: arMessages.paymentResult.actions.openCourse })).toHaveAttribute(
      "href",
      "/my-courses/12",
    );
    expect(screen.getByText("Physics")).toBeInTheDocument();
    expect(screen.getByText("250.00 EGP")).toBeInTheDocument();
    expect(document.body.textContent).not.toContain("1.00");
    expect(screen.getByText(arMessages.paymentResult.supportReferenceLabel)).toBeInTheDocument();
    expect(screen.getByText("FAKE")).toBeInTheDocument();
  });

  it("shows a refresh path when the enrollment is not found yet", () => {
    renderView({ status: "completed", course_id: "0" });

    expect(
      screen.queryByRole("link", { name: arMessages.paymentResult.actions.openCourse }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: arMessages.paymentResult.actions.myCourses })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: arMessages.paymentResult.refresh })).toBeInTheDocument();
  });

  it("shows a confirming state while the enrollment query is loading", () => {
    mockUseMyCourses.mockReturnValue({ data: undefined, isLoading: true, isFetching: true, error: null, refetch: vi.fn() });
    renderView({ status: "completed", course_id: "12" });

    expect(screen.getByRole("heading", { name: arMessages.paymentResult.title.confirming })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: arMessages.paymentResult.refresh })).not.toBeInTheDocument();
  });

  it("prompts unauthenticated students to sign in", () => {
    mockUseMyCourses.mockReturnValue({ data: undefined, isLoading: false, error: { status: 401 }, refetch: vi.fn() });
    renderView({ status: "completed", course_id: "12" });

    expect(screen.getByRole("link", { name: arMessages.paymentResult.actions.login })).toHaveAttribute("href", "/login");
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

    const expected = status === "completed"
      ? arMessages.paymentResult.title.notFound
      : arMessages.paymentResult.title[status];
    expect(screen.getByRole("heading", { name: expected })).toBeInTheDocument();
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

  it("separates the test-mode label from its explanatory note", () => {
    renderView({ status: "completed", mode: "test" });

    const badge = screen.getByText(arMessages.paymentResult.testModeNote, {
      exact: true,
    }).parentElement;

    expect(badge).toHaveTextContent(
      `${arMessages.paymentResult.testModeBadge} · ${arMessages.paymentResult.testModeNote}`,
    );
  });
});
