import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import arMessages from "@/src/messages/ar.json";
import type { GradeDto, StreamDto, StudentProfileDto, SubjectDto } from "@/src/lib/student-api/contract";
import OnboardingFlow, { subjectsFor } from "./onboarding-flow";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: React.ComponentProps<"img"> & { fill?: boolean; priority?: boolean }) => {
    const rest = { ...props } as Record<string, unknown>;
    delete rest.fill;
    delete rest.priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...(rest as React.ComponentProps<"img">)} src={typeof src === "string" ? src : undefined} alt={alt ?? ""} />;
  },
}));

const replace = vi.fn();
vi.mock("@/src/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
  Link: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => <a href={href} {...rest}>{children}</a>,
}));

const save = vi.fn();
const readDraft = vi.fn();
vi.mock("../client", () => ({
  PHONE_PATTERN: /^[0-9+ ]{10,20}$/,
  saveStudentOnboarding: (...args: unknown[]) => save(...args),
  readOnboardingDraft: (...args: unknown[]) => readDraft(...args),
}));

const grades = [
  { id: 10, name: "Grade 10", level: "GRADE_10" },
  { id: 11, name: "Grade 11", level: "GRADE_11" },
] as GradeDto[];
const streams = [{ id: 1, name: "علمي علوم" }, { id: 2, name: "أدبي" }] as StreamDto[];
const subjects = [
  { id: 100, name: "كيمياء", grades: [{ id: 10 }], streams: [{ id: 1 }] },
  { id: 101, name: "أحياء", grades: [{ id: 10 }], streams: [{ id: 1 }] },
  { id: 102, name: "تاريخ", grades: [{ id: 10 }], streams: [{ id: 2 }] },
] as unknown as SubjectDto[];

let queryClient: QueryClient;

function renderFlow(props: { needsPhone?: boolean; initialProfile?: StudentProfileDto | null } = {}) {
  return render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="ar" messages={arMessages}>
        <OnboardingFlow grades={grades} streams={streams} subjects={subjects} ownerId={7} {...props} />
      </NextIntlClientProvider>
    </QueryClientProvider>,
  );
}

/** Waits until only the given step is on screen (the previous one animates out). */
async function onStep(step: string) {
  await waitFor(() => {
    const sections = document.querySelectorAll("[data-step]");
    expect(sections).toHaveLength(1);
    expect(sections[0]).toHaveAttribute("data-step", step);
  });
}

async function walkToSubjects() {
  fireEvent.click(screen.getByRole("button", { name: /يلا نبدأ/ }));
  await onStep("grade");
  fireEvent.click(screen.getByRole("radio", { name: /Grade 10/ }));
  fireEvent.click(screen.getByRole("button", { name: /التالي/ }));
  await onStep("stream");
  fireEvent.click(screen.getByRole("radio", { name: /علمي علوم/ }));
  fireEvent.click(screen.getByRole("button", { name: /التالي/ }));
  await onStep("subjects");
}

describe("OnboardingFlow", () => {
  beforeEach(() => {
    queryClient = new QueryClient();
    save.mockReset();
    readDraft.mockReset().mockReturnValue(null);
    replace.mockReset();
  });
  afterEach(() => cleanup());

  it("walks through every step (regression: the flow used to stop after the grade step)", async () => {
    renderFlow();
    await walkToSubjects();
    // Subjects for the chosen grade and stream are preselected.
    expect(screen.getByRole("checkbox", { name: /كيمياء/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("checkbox", { name: /أحياء/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("checkbox", { name: /تاريخ/ })).toBeNull();
  });

  it("shows the grade numeral instead of the raw backend level", async () => {
    renderFlow();
    fireEvent.click(screen.getByRole("button", { name: /يلا نبدأ/ }));
    await screen.findByRole("radio", { name: /Grade 10/ });
    expect(screen.queryByText("GRADE_10")).toBeNull();
  });

  it("saves the choices and shows the done step", async () => {
    save.mockResolvedValue({});
    renderFlow();
    await walkToSubjects();
    fireEvent.click(screen.getByRole("checkbox", { name: /أحياء/ }));
    fireEvent.click(screen.getByRole("button", { name: /احفظ وابدأ/ }));
    await screen.findByRole("heading", { name: "كل حاجة جاهزة!" });
    expect(save).toHaveBeenCalledWith({ grade_id: 10, stream_id: 1, subject_ids: [100] }, 7);
    expect(screen.getByRole("link", { name: /تصفح كورسات صفك/ })).toHaveAttribute("href", "/explore?grade=10&stream=1");
  });

  it("keeps the student on the step with a retry when saving fails", async () => {
    save.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce({});
    renderFlow();
    await walkToSubjects();
    fireEvent.click(screen.getByRole("button", { name: /احفظ وابدأ/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("تعذّر حفظ اختياراتك");
    fireEvent.click(screen.getByRole("button", { name: "حاول مرة أخرى" }));
    await screen.findByRole("heading", { name: "كل حاجة جاهزة!" });
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("refreshes the cached profile and user after saving", async () => {
    save.mockResolvedValue({});
    queryClient.setQueryData(["student", "profile"], { grade_id: null });
    queryClient.setQueryData(["student", "me"], { id: 7, phone_number: null });
    renderFlow();
    await walkToSubjects();
    fireEvent.click(screen.getByRole("button", { name: /احفظ وابدأ/ }));
    await screen.findByRole("heading", { name: "كل حاجة جاهزة!" });
    expect(queryClient.getQueryState(["student", "profile"])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(["student", "me"])?.isInvalidated).toBe(true);
  });

  it("starts from the profile saved on the backend when editing", async () => {
    renderFlow({ initialProfile: { phone_number: "01000000000", grade_id: 10, stream_id: 1, subject_ids: [101] } });
    fireEvent.click(screen.getByRole("button", { name: /يلا نبدأ/ }));
    await onStep("grade");
    expect(screen.getByRole("radio", { name: /Grade 10/ })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("button", { name: /التالي/ }));
    await onStep("stream");
    fireEvent.click(screen.getByRole("button", { name: /التالي/ }));
    await onStep("subjects");
    expect(screen.getByRole("checkbox", { name: /أحياء/ })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("checkbox", { name: /كيمياء/ })).toHaveAttribute("aria-checked", "false");
    expect(readDraft).not.toHaveBeenCalled();
  });

  it("falls back to this student's device draft without a backend profile", async () => {
    readDraft.mockReturnValue({ grade_id: 11, stream_id: 2, subject_ids: [] });
    renderFlow();
    await waitFor(() => expect(readDraft).toHaveBeenCalledWith(7));
    fireEvent.click(screen.getByRole("button", { name: /يلا نبدأ/ }));
    await onStep("grade");
    expect(screen.getByRole("radio", { name: /Grade 11/ })).toHaveAttribute("aria-checked", "true");
  });

  it("lets the student skip to the dashboard", () => {
    renderFlow();
    fireEvent.click(screen.getByRole("button", { name: "تخطَّ الآن" }));
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });
});

describe("subjectsFor", () => {
  it("prefers exact grade+stream matches and falls back to the grade", () => {
    expect(subjectsFor(subjects, 10, 1).map((s) => s.id)).toEqual([100, 101]);
    expect(subjectsFor(subjects, 10, 99).map((s) => s.id)).toEqual([100, 101, 102]);
    expect(subjectsFor(subjects, null, 1)).toEqual([]);
  });
});

describe("OnboardingFlow phone step", () => {
  beforeEach(() => {
    queryClient = new QueryClient();
    save.mockReset().mockResolvedValue({});
    readDraft.mockReset().mockReturnValue(null);
  });
  afterEach(() => cleanup());

  const phoneInput = () => screen.getByRole("textbox", { name: "رقم الموبايل" });

  async function startWithPhone() {
    renderFlow({ needsPhone: true });
    fireEvent.click(screen.getByRole("button", { name: /يلا نبدأ/ }));
    await onStep("phone");
  }

  async function finishStudySteps() {
    await onStep("grade");
    fireEvent.click(screen.getByRole("radio", { name: /Grade 10/ }));
    fireEvent.click(screen.getByRole("button", { name: /التالي/ }));
    await onStep("stream");
    fireEvent.click(screen.getByRole("radio", { name: /علمي علوم/ }));
    fireEvent.click(screen.getByRole("button", { name: /التالي/ }));
    await onStep("subjects");
    fireEvent.click(screen.getByRole("button", { name: /احفظ وابدأ/ }));
    await screen.findByRole("heading", { name: "كل حاجة جاهزة!" });
  }

  it("asks for the phone first and adds it to the stepper", async () => {
    await startWithPhone();
    expect(phoneInput()).toHaveAttribute("type", "tel");
    const steps = screen.getByRole("navigation", { name: "خطوات تجهيز الحساب" });
    expect(steps.querySelectorAll("li")).toHaveLength(4);
    expect(steps).toHaveTextContent("الخطوة 1 من 4");
  });

  it("goes straight to the grade when the student already has a phone", async () => {
    renderFlow({ needsPhone: false });
    fireEvent.click(screen.getByRole("button", { name: /يلا نبدأ/ }));
    await onStep("grade");
    expect(screen.queryByRole("textbox", { name: "رقم الموبايل" })).toBeNull();
    expect(screen.getByRole("navigation", { name: "خطوات تجهيز الحساب" }).querySelectorAll("li")).toHaveLength(3);
  });

  it("needs a valid phone to continue", async () => {
    await startWithPhone();
    for (const value of ["", "abc", "123", "1".repeat(21)]) {
      fireEvent.change(phoneInput(), { target: { value } });
      expect(screen.getByRole("button", { name: /التالي/ })).toBeDisabled();
    }
    fireEvent.change(phoneInput(), { target: { value: "+20 100 000 0000" } });
    expect(phoneInput()).toHaveAttribute("aria-invalid", "false");
    expect(screen.getByRole("button", { name: /التالي/ })).toBeEnabled();
  });

  it("saves the phone with the study profile", async () => {
    await startWithPhone();
    fireEvent.change(phoneInput(), { target: { value: "01000000000" } });
    fireEvent.click(screen.getByRole("button", { name: /التالي/ }));
    await finishStudySteps();
    expect(save).toHaveBeenCalledWith({ grade_id: 10, stream_id: 1, subject_ids: [100, 101], phone_number: "01000000000" }, 7);
  });

  it("can be skipped, and then saves without a phone", async () => {
    await startWithPhone();
    fireEvent.change(phoneInput(), { target: { value: "01000000000" } });
    fireEvent.click(screen.getByRole("button", { name: "تخطَّ الخطوة دي" }));
    await finishStudySteps();
    expect(save).toHaveBeenCalledWith({ grade_id: 10, stream_id: 1, subject_ids: [100, 101] }, 7);
  });

  it("goes back from the grade to the phone step", async () => {
    await startWithPhone();
    fireEvent.click(screen.getByRole("button", { name: "تخطَّ الخطوة دي" }));
    await onStep("grade");
    fireEvent.click(screen.getByRole("button", { name: /رجوع/ }));
    await onStep("phone");
  });
});
