import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { domAnimation, LazyMotion, MotionGlobalConfig } from "motion/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import arMessages from "@/src/messages/ar.json";
import { courseTestMessages } from "@/src/messages/course-tests";
import { CourseTestsApiError, type CourseTestsClient } from "../client";
import type { AnswerResponse, Attempt, AttemptQuestion, AttemptResult, CourseTestDetail } from "../types";
import { AttemptPlayer } from "./attempt-player";
import { pendingStorageKey } from "./autosave-queue";
import { OrderingInput } from "./ordering-input";

MotionGlobalConfig.skipAnimations = true;

const client = {
  getAttempt: vi.fn<CourseTestsClient["getAttempt"]>(),
  saveAnswer: vi.fn<CourseTestsClient["saveAnswer"]>(),
  submitAttempt: vi.fn<CourseTestsClient["submitAttempt"]>(),
  getResult: vi.fn<CourseTestsClient["getResult"]>(),
};

vi.mock("../client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../client")>()),
  getCourseTestsClient: () => Promise.resolve(client),
}));

const messages = { ...arMessages, courseTests: courseTestMessages("ar") };
const ar = courseTestMessages("ar").attempt;

const question = (id: number, text: string, extra: Partial<AttemptQuestion> = {}): AttemptQuestion => ({
  id,
  type: "single",
  text,
  code_snippet: null,
  image_url: null,
  points: 2,
  options: [
    { id: "a", text: `${text}-a` },
    { id: "b", text: `${text}-b` },
  ],
  response: null,
  flagged: false,
  client_version: 0,
  ...extra,
});

function makeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  const now = new Date();
  return {
    id: 77,
    test_id: 501,
    number: 1,
    status: "in_progress",
    started_at: now.toISOString(),
    deadline_at: new Date(now.getTime() + 10 * 60_000).toISOString(),
    server_now: now.toISOString(),
    allow_back_navigation: true,
    questions: [question(1, "Q1"), question(2, "Q2"), question(3, "Q3"), question(4, "Q4")],
    ...overrides,
  };
}

const test = { id: 501, title: "اختبار الدرس الأول", lesson_title: "lesson 1", time_limit_minutes: 15 } as CourseTestDetail;

const result = (overrides: Partial<AttemptResult> = {}) => ({ id: 77, answered_count: 1, question_count: 4, auto_submitted: false, ...overrides }) as AttemptResult;

function renderPlayer(attempt: Attempt) {
  client.getAttempt.mockResolvedValue(attempt);
  const onExit = vi.fn();
  const onShowResult = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="ar" messages={messages}>
        <LazyMotion features={domAnimation} strict>
          <AttemptPlayer test={test} attemptId={attempt.id} onExit={onExit} onShowResult={onShowResult} />
        </LazyMotion>
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
  return { onExit, onShowResult };
}

const heading = (text: string) => screen.findByRole("heading", { level: 2, name: new RegExp(text) });

describe("AttemptPlayer", () => {
  beforeEach(() => {
    localStorage.clear();
    client.saveAnswer.mockReset().mockResolvedValue(undefined);
    client.submitAttempt.mockReset().mockResolvedValue(result());
    client.getResult.mockReset().mockResolvedValue(result());
  });
  afterEach(() => cleanup());

  it("shows answered / unanswered / flagged counts in the submit confirmation and jumps to a listed question", async () => {
    renderPlayer(
      makeAttempt({
        questions: [question(1, "Q1", { response: "a" }), question(2, "Q2", { flagged: true }), question(3, "Q3", { response: "b" }), question(4, "Q4")],
      }),
    );
    // Resumes at the first unanswered question.
    await heading("Q2");

    fireEvent.click(screen.getAllByRole("button", { name: ar.nav.reviewAndSubmit })[0]);
    const dialog = await screen.findByRole("dialog", { name: ar.confirm.title });
    const count = (label: string) => within(dialog).getByText(label, { selector: "dt" }).nextElementSibling?.textContent;
    expect(count(ar.confirm.answered)).toBe("2");
    expect(count(ar.confirm.unanswered)).toBe("2");
    expect(count(ar.confirm.flagged)).toBe("1");
    expect(within(dialog).getByRole("button", { name: "السؤال 2 · مُعلَّم" })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "السؤال 2 · بدون إجابة" })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "السؤال 4 · بدون إجابة" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await heading("Q4");
  });

  it("flushes pending saves before submitting and guards against double submit", async () => {
    const { onShowResult } = renderPlayer(makeAttempt());
    await heading("Q1");
    fireEvent.click(screen.getByRole("radio", { name: /Q1-b/ }));

    fireEvent.click(screen.getAllByRole("button", { name: ar.nav.reviewAndSubmit })[0]);
    const dialog = await screen.findByRole("dialog", { name: ar.confirm.title });
    const submit = within(dialog).getByRole("button", { name: ar.confirm.submit });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(onShowResult).toHaveBeenCalledWith(77));
    expect(client.submitAttempt).toHaveBeenCalledTimes(1);
    expect(client.saveAnswer).toHaveBeenCalledWith(77, 1, expect.objectContaining({ response: "b", flagged: false }));
    expect(client.saveAnswer.mock.invocationCallOrder[0]).toBeLessThan(client.submitAttempt.mock.invocationCallOrder[0]);
  });

  it("does not submit when unsent answers can't be saved", async () => {
    client.saveAnswer.mockRejectedValue(new CourseTestsApiError("network", 0));
    const { onShowResult } = renderPlayer(makeAttempt());
    await heading("Q1");
    fireEvent.click(screen.getByRole("radio", { name: /Q1-a/ }));
    fireEvent.click(screen.getAllByRole("button", { name: ar.nav.reviewAndSubmit })[0]);
    const dialog = await screen.findByRole("dialog", { name: ar.confirm.title });
    fireEvent.click(within(dialog).getByRole("button", { name: ar.confirm.submit }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(ar.confirm.saveFailed);
    expect(client.submitAttempt).not.toHaveBeenCalled();
    expect(onShowResult).not.toHaveBeenCalled();
  });

  it("autosaves every question independently while navigating (no lost answers)", async () => {
    renderPlayer(makeAttempt());
    await heading("Q1");
    fireEvent.click(screen.getByRole("radio", { name: /Q1-a/ }));
    fireEvent.click(screen.getAllByRole("button", { name: ar.nav.next })[0]);
    await heading("Q2");
    fireEvent.click(screen.getByRole("radio", { name: /Q2-b/ }));

    // Both answers are on the device before anything is sent.
    const pending = JSON.parse(localStorage.getItem(pendingStorageKey(77)) ?? "{}");
    expect(pending).toMatchObject({ 1: { response: "a" }, 2: { response: "b" } });

    await waitFor(() => expect(client.saveAnswer).toHaveBeenCalledTimes(2), { timeout: 3000 });
    expect(client.saveAnswer).toHaveBeenCalledWith(77, 1, expect.objectContaining({ response: "a" }));
    expect(client.saveAnswer).toHaveBeenCalledWith(77, 2, expect.objectContaining({ response: "b" }));
    await waitFor(() => expect(localStorage.getItem(pendingStorageKey(77))).toBeNull());
  });

  it("shows the save-failure toast and flushes the queue when the browser comes back online", async () => {
    client.saveAnswer.mockRejectedValueOnce(new CourseTestsApiError("network", 0));
    renderPlayer(makeAttempt());
    await heading("Q1");
    fireEvent.click(screen.getByRole("radio", { name: /Q1-a/ }));

    expect(await screen.findByText(ar.toast.message, {}, { timeout: 3000 })).toBeInTheDocument();
    expect(localStorage.getItem(pendingStorageKey(77))).not.toBeNull();

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    await waitFor(() => expect(client.saveAnswer).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText(ar.toast.message)).not.toBeInTheDocument());
    expect(localStorage.getItem(pendingStorageKey(77))).toBeNull();
  });

  it("merges unsent local answers over the server response on load and flushes them", async () => {
    localStorage.setItem(pendingStorageKey(77), JSON.stringify({ 1: { response: "b", flagged: true, client_version: Date.now() } }));
    renderPlayer(makeAttempt({ questions: [question(1, "Q1", { response: "a" }), question(2, "Q2")] }));
    await heading("Q2"); // Q1 counts as answered, so we resume at Q2.
    fireEvent.click(screen.getAllByRole("button", { name: /السؤال 1 ·/ })[0]);
    await heading("Q1");
    expect(screen.getByRole("radio", { name: /Q1-b/ })).toBeChecked();
    expect(screen.getByRole("button", { name: ar.question.flagged })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(client.saveAnswer).toHaveBeenCalledWith(77, 1, expect.objectContaining({ response: "b", flagged: true })));
  });

  it("locks backward navigation when the test disallows it", async () => {
    renderPlayer(makeAttempt({ allow_back_navigation: false }));
    await heading("Q1");
    fireEvent.click(screen.getAllByRole("button", { name: ar.nav.next })[0]);
    await heading("Q2");

    expect(screen.getByRole("button", { name: ar.nav.prev })).toBeDisabled();
    expect(screen.getByRole("button", { name: ar.nav.prevAria })).toBeDisabled();
    const firstCell = screen.getAllByRole("button", { name: /^السؤال 1 ·/ })[0];
    expect(firstCell).toBeDisabled();
    expect(firstCell).toHaveAccessibleName(expect.stringContaining(ar.navigator.stateLocked));
    expect(screen.getAllByRole("button", { name: /^السؤال 4 ·/ })[0]).toBeEnabled();
  });

  it("submits automatically at 00:00 and shows the Time-Up screen", async () => {
    const now = new Date().toISOString();
    client.submitAttempt.mockResolvedValue(result({ answered_count: 1, question_count: 4 }));
    const { onShowResult } = renderPlayer(makeAttempt({ deadline_at: now, server_now: now, questions: [question(1, "Q1", { response: "a" }), question(2, "Q2"), question(3, "Q3"), question(4, "Q4")] }));

    const dialog = await screen.findByRole("alertdialog", { name: ar.timeUp.title });
    expect(dialog).toHaveTextContent("سلّمنا إجاباتك تلقائياً. أجبت على 1 من 4 أسئلة.");
    expect(client.submitAttempt).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole("button", { name: ar.timeUp.showResult }));
    expect(onShowResult).toHaveBeenCalledWith(77);
  });

  it("shows Time-Up for an attempt the server already auto-submitted", async () => {
    client.getResult.mockResolvedValue(result({ auto_submitted: true, answered_count: 3, question_count: 4 }));
    renderPlayer(makeAttempt({ status: "submitted" }));
    const dialog = await screen.findByRole("alertdialog", { name: ar.timeUp.title });
    expect(dialog).toHaveTextContent("أجبت على 3 من 4 أسئلة");
  });

  it("goes straight to the result for an attempt that was submitted manually", async () => {
    const { onShowResult } = renderPlayer(makeAttempt({ status: "graded" }));
    await waitFor(() => expect(onShowResult).toHaveBeenCalledWith(77));
  });

  it("hides the timer for tests without a time limit", async () => {
    renderPlayer(makeAttempt({ deadline_at: null }));
    await heading("Q1");
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });
});

describe("OrderingInput", () => {
  function Harness({ initial }: { initial: AnswerResponse }) {
    const [value, setValue] = useState<AnswerResponse>(initial);
    return (
      <NextIntlClientProvider locale="ar" messages={messages}>
        <LazyMotion features={domAnimation} strict>
          <OrderingInput
            labelledBy="q"
            question={question(9, "Order", { type: "ordering", options: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }] })}
            value={value}
            onChange={setValue}
          />
          <output data-testid="value">{JSON.stringify(value)}</output>
        </LazyMotion>
      </NextIntlClientProvider>
    );
  }
  afterEach(() => cleanup());

  it("reorders with the up/down buttons and announces the new position", async () => {
    render(<Harness initial={null} />);
    expect(screen.getByRole("button", { name: "تحريك «A» للأعلى" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "تحريك «C» للأسفل" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "تحريك «B» للأسفل" }));
    expect(screen.getByTestId("value")).toHaveTextContent('["a","c","b"]');
    expect(screen.getByText("«B» الآن في الموضع 3 من 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "تحريك «B» للأعلى" }));
    fireEvent.click(screen.getByRole("button", { name: "تحريك «B» للأعلى" }));
    expect(screen.getByTestId("value")).toHaveTextContent('["b","a","c"]');
    expect(screen.getByText("«B» الآن في الموضع 1 من 3")).toBeInTheDocument();
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((item) => item.textContent?.replace(/\d/g, ""))).toEqual(["B", "A", "C"]);
  });

  it("lets the student accept the initial order as their answer", () => {
    render(<Harness initial={null} />);
    fireEvent.click(screen.getByRole("button", { name: /اعتمد هذا الترتيب/ }));
    expect(screen.getByTestId("value")).toHaveTextContent('["a","b","c"]');
  });
});
