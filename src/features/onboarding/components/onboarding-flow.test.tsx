import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import arMessages from "@/src/messages/ar.json";
import type { GradeDto, StreamDto, SubjectDto } from "@/src/lib/student-api/contract";
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
vi.mock("../client", () => ({
  saveStudentOnboarding: (...args: unknown[]) => save(...args),
  readOnboardingDraft: () => null,
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

function renderFlow() {
  return render(
    <NextIntlClientProvider locale="ar" messages={arMessages}>
      <OnboardingFlow grades={grades} streams={streams} subjects={subjects} />
    </NextIntlClientProvider>,
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
    save.mockReset();
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
    save.mockResolvedValue("saved");
    renderFlow();
    await walkToSubjects();
    fireEvent.click(screen.getByRole("checkbox", { name: /أحياء/ }));
    fireEvent.click(screen.getByRole("button", { name: /احفظ وابدأ/ }));
    await screen.findByRole("heading", { name: "كل حاجة جاهزة!" });
    expect(save).toHaveBeenCalledWith({ grade_id: 10, stream_id: 1, subject_ids: [100] });
    expect(screen.getByRole("link", { name: /تصفح كورسات صفك/ })).toHaveAttribute("href", "/explore?grade=10&stream=1");
  });

  it("keeps the student on the step with a retry when saving fails", async () => {
    save.mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce("saved_locally");
    renderFlow();
    await walkToSubjects();
    fireEvent.click(screen.getByRole("button", { name: /احفظ وابدأ/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent("تعذّر حفظ اختياراتك");
    fireEvent.click(screen.getByRole("button", { name: "حاول مرة أخرى" }));
    await screen.findByRole("heading", { name: "كل حاجة جاهزة!" });
    expect(screen.getByText("اتحفظت اختياراتك على الجهاز ده.")).toBeInTheDocument();
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
