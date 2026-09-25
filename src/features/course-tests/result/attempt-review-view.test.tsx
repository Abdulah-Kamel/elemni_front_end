import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CourseTestsApiError } from "../client";
import type { AttemptReview } from "../types";
import { AttemptReviewView } from "./attempt-review-view";
import { countByFilter } from "./review-filter";
import { IntlWrapper, makeQuestion, makeResult, testDetail } from "./test-utils";

const state = vi.hoisted(() => ({
  query: { isPending: false, data: undefined as AttemptReview | undefined, error: null as unknown, refetch: vi.fn() },
}));

vi.mock("../hooks", () => ({ useAttemptReview: () => state.query }));

const questions = [
  makeQuestion({ id: 1 }),
  makeQuestion({
    id: 2,
    type: "multi",
    text: "اختر جميع أنواع البيانات الرقمية في بايثون.",
    status: "wrong",
    points_awarded: 0,
    options: [
      { id: "a", text: "int" },
      { id: "b", text: "float" },
      { id: "c", text: "str" },
      { id: "d", text: "complex" },
    ],
    response: ["a", "b"],
    correct_response: ["a", "b", "d"],
    explanation: "النوع complex نوع رقمي أيضاً.",
  }),
  makeQuestion({ id: 3, status: "wrong", points_awarded: 0, response: "b", correct_response: "a" }),
  makeQuestion({ id: 4, text: "ماذا يطبع الكود التالي؟", status: "blank", points_awarded: 0, response: null }),
  makeQuestion({
    id: 5,
    type: "essay",
    status: "partial",
    points: 4,
    points_awarded: 2,
    options: [],
    response: "list قابلة للتعديل",
    correct_response: null,
    model_answer: "list قابلة للتعديل و tuple ثابتة",
    feedback: "أضف مثالاً",
  }),
  makeQuestion({ id: 6, type: "essay", status: "pending", points: 4, points_awarded: null, options: [], response: "نص", correct_response: null }),
  makeQuestion({
    id: 7,
    type: "matching",
    status: "wrong",
    points_awarded: 0,
    options: [
      { id: "a", text: "print()" },
      { id: "b", text: "len()" },
    ],
    right_options: [
      { id: "x", text: "عرض قيمة" },
      { id: "z", text: "حساب الطول" },
    ],
    response: { a: "z", b: "x" },
    correct_response: { a: "x", b: "z" },
  }),
];

function renderReview(data: AttemptReview | undefined, onBackToResult = vi.fn()) {
  state.query.data = data;
  render(
    <IntlWrapper>
      <AttemptReviewView test={testDetail} attemptId={9001} onBackToResult={onBackToResult} />
    </IntlWrapper>,
  );
  return { onBackToResult };
}

describe("review filters", () => {
  it("counts partial as wrong and pending only under all", () => {
    expect(countByFilter(questions)).toEqual({ all: 7, correct: 1, wrong: 4, blank: 1 });
  });
});

describe("AttemptReviewView", () => {
  beforeEach(() => {
    state.query = { isPending: false, data: undefined, error: null, refetch: vi.fn() };
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(cleanup);

  it("renders the header, tabs with counts and the summary", () => {
    const { onBackToResult } = renderReview({ attempt: makeResult(), questions });

    expect(screen.getByRole("heading", { level: 1, name: "مراجعة الإجابات" })).toBeInTheDocument();
    expect(screen.getByText("اختبار الدرس الأول · المحاولة 2")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "الكل · 7" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "صحيحة · 1" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "خاطئة · 4" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "بدون إجابة · 1" })).toBeInTheDocument();
    expect(screen.getByText("17 من 20 · 11:24 دقيقة")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "العودة للنتيجة" }));
    expect(onBackToResult).toHaveBeenCalledWith(9001);
  });

  it("marks chosen, wrong and missed options with text, not only color", () => {
    renderReview({ attempt: makeResult(), questions });

    const multi = screen.getByRole("article", { name: "اختر جميع أنواع البيانات الرقمية في بايثون." });
    expect(within(multi).getByText("إجابة ناقصة · 0 من 2")).toBeInTheDocument();
    expect(within(multi).getAllByText("إجابتك · صحيحة")).toHaveLength(2);
    expect(within(multi).getByText("إجابة صحيحة لم تخترها")).toBeInTheDocument();
    expect(within(multi).getByRole("heading", { name: "التوضيح" })).toBeInTheDocument();

    const single = screen.getByRole("article", { name: "سؤال 3" });
    expect(within(single).getByText("خاطئة · 0 من 2")).toBeInTheDocument();
    expect(within(single).getByText("إجابتك")).toBeInTheDocument();
    expect(within(single).getByText("الإجابة الصحيحة")).toBeInTheDocument();
  });

  it("shows essay feedback, model answer, partial and pending points", () => {
    renderReview({ attempt: makeResult(), questions });

    expect(screen.getByText("درجة جزئية · 2 من 4")).toBeInTheDocument();
    expect(screen.getByText("أضف مثالاً")).toBeInTheDocument();
    expect(screen.getByText("list قابلة للتعديل و tuple ثابتة")).toBeInTheDocument();
    expect(screen.getByText("بانتظار التصحيح · 4 درجات")).toBeInTheDocument();
  });

  it("renders matching pairs with right option labels", () => {
    renderReview({ attempt: makeResult(), questions });
    const matching = screen.getByRole("article", { name: "سؤال 7" });
    expect(within(matching).getAllByText("عرض قيمة")).toHaveLength(2);
    expect(within(matching).getAllByText("حساب الطول")).toHaveLength(2);
  });

  it("collapses unanswered questions until expanded", () => {
    renderReview({ attempt: makeResult(), questions });
    const toggle = screen.getByRole("button", { name: /عرض السؤال/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(within(toggle).getByText("بدون إجابة · 0 من 2")).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "إخفاء السؤال" })).toHaveAttribute("aria-expanded", "true");
  });

  it("filters questions by tab", () => {
    renderReview({ attempt: makeResult(), questions });
    fireEvent.click(screen.getByRole("tab", { name: "صحيحة · 1" }));
    expect(screen.getByRole("tab", { name: "صحيحة · 1" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("article", { name: "سؤال 3" })).not.toBeInTheDocument();
  });

  it("jumps to a question from the navigator, resetting a hiding filter", () => {
    renderReview({ attempt: makeResult(), questions });
    fireEvent.click(screen.getByRole("tab", { name: "صحيحة · 1" }));
    fireEvent.click(screen.getByRole("button", { name: "السؤال 3 · خاطئة" }));

    expect(screen.getByRole("tab", { name: "الكل · 7" })).toHaveAttribute("aria-selected", "true");
    const card = screen.getByRole("article", { name: "سؤال 3" });
    expect(card.scrollIntoView).toHaveBeenCalled();
    expect(card).toHaveFocus();
  });

  it("shows a friendly message when review is not allowed", () => {
    state.query.error = new CourseTestsApiError("المراجعة غير متاحة.", 403);
    renderReview(undefined);
    expect(screen.getByText("مراجعة الإجابات غير متاحة الآن")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "العودة للنتيجة" })).toBeInTheDocument();
  });
});
