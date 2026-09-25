"use client";

import { m } from "motion/react";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudCheck,
  Hourglass,
  RotateCcw,
  Target,
  TimerReset,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/cn";
import { formatClock, formatShortDate, formatTestDate } from "../format";
import { courseItemHref } from "../routes";
import type { AttemptSummary, CourseTestDetail } from "../types";
import { useServerCountdown } from "../sidebar/use-server-countdown";

export const cardClass =
  "rounded-3xl border border-[#E4E2DC] bg-white dark:border-slate-800 dark:bg-slate-900";
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-brand-300 dark:focus-visible:ring-offset-slate-900";

// ── Stat tiles ───────────────────────────────────────────────────────────────

type DotKind = "passed" | "failed" | "in_progress" | "pending" | "unused";

function dotKind(attempt: AttemptSummary): DotKind {
  if (attempt.status === "in_progress") return "in_progress";
  if (attempt.status !== "graded") return "pending";
  return attempt.passed ? "passed" : "failed";
}

const dotClass: Record<DotKind, string> = {
  passed: "bg-green-500",
  failed: "bg-red-500",
  in_progress: "bg-amber-500",
  pending: "bg-brand-500",
  unused: "border-2 border-slate-300 dark:border-slate-600",
};

export function AttemptDots({ test }: { test: CourseTestDetail }) {
  const t = useTranslations("courseTests.intro");
  const sorted = [...test.attempts].sort((a, b) => a.number - b.number);
  const dots: { number: number; kind: DotKind }[] = sorted.map((attempt) => ({ number: attempt.number, kind: dotKind(attempt) }));
  if (test.max_attempts !== null) {
    for (let number = dots.length + 1; number <= test.max_attempts; number++) dots.push({ number, kind: "unused" });
  }
  if (!dots.length || dots.length > 12) return null;
  const label = (dot: { number: number; kind: DotKind }) =>
    t(({ passed: "dotPassed", failed: "dotFailed", in_progress: "dotInProgress", pending: "dotPending", unused: "dotUnused" } as const)[dot.kind], { number: dot.number });

  return (
    <span role="img" aria-label={t("attemptDots", { summary: dots.map(label).join("، ") })} className="flex flex-wrap gap-1">
      {dots.map((dot, index) => (
        <m.span
          key={dot.number}
          title={label(dot)}
          className={cn("size-2.5 rounded-full", dotClass[dot.kind])}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.25 + index * 0.06, type: "spring", stiffness: 420, damping: 18 }}
        />
      ))}
    </span>
  );
}

function StatTile({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-slate-100 p-4 dark:bg-slate-800/70">
      <span className="flex items-center gap-1.5 text-[13px] text-muted dark:text-slate-400">
        {icon}
        {label}
      </span>
      {children}
    </div>
  );
}

export function StatTiles({ test }: { test: CourseTestDetail }) {
  const t = useTranslations("courseTests.intro");
  const tc = useTranslations("courseTests.common");
  const value = "text-lg font-bold tabular-nums text-ink sm:text-xl dark:text-slate-50";
  const iconClass = "size-4 shrink-0";
  const used = test.attempts.length;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatTile icon={<CircleHelp className={iconClass} aria-hidden="true" />} label={t("statQuestions")}>
        <span className={value}>{tc("questions", { count: test.question_count })}</span>
      </StatTile>
      <StatTile icon={<Clock3 className={iconClass} aria-hidden="true" />} label={t("statDuration")}>
        <span className={value}>{test.time_limit_minutes ? tc("minutes", { count: test.time_limit_minutes }) : t("noTimeLimit")}</span>
      </StatTile>
      <StatTile icon={<Target className={iconClass} aria-hidden="true" />} label={t("statPass")}>
        <span className={value}>{test.pass_percent}%</span>
      </StatTile>
      <StatTile icon={<RotateCcw className={iconClass} aria-hidden="true" />} label={t("statAttempts")}>
        <span className="flex flex-wrap items-center gap-2">
          <span className={value}>
            {used === 0
              ? test.max_attempts === null ? t("unlimitedAttempts") : tc("attempts", { count: test.max_attempts })
              : test.max_attempts === null ? tc("attempts", { count: used }) : t("usedOf", { used, max: test.max_attempts })}
          </span>
          {used > 0 && <AttemptDots test={test} />}
        </span>
      </StatTile>
    </div>
  );
}

// ── Rules ────────────────────────────────────────────────────────────────────

export function RulesList({ test }: { test: CourseTestDetail }) {
  const t = useTranslations("courseTests.intro");
  const tc = useTranslations("courseTests.common");
  const icon = "size-4";
  const rules: { key: string; icon: ReactNode; text: string }[] = [];
  if (test.time_limit_minutes) {
    rules.push({ key: "timer", icon: <Clock3 className={icon} />, text: t("ruleTimer") });
  } else {
    rules.push({ key: "no-limit", icon: <Clock3 className={icon} />, text: t("ruleNoLimit") });
  }
  rules.push({
    key: "autosave",
    icon: <CloudCheck className={icon} />,
    text: test.allow_back_navigation ? t("ruleAutosaveBack") : t("ruleAutosaveNoBack"),
  });
  if (test.time_limit_minutes) rules.push({ key: "time-up", icon: <Hourglass className={icon} />, text: t("ruleTimeUp") });
  rules.push(
    test.max_attempts === 1
      ? { key: "policy", icon: <Award className={icon} />, text: t("ruleSingleAttempt") }
      : {
          key: "policy",
          icon: <Award className={icon} />,
          text: t(({ highest: "rulePolicyHighest", last: "rulePolicyLast", average: "rulePolicyAverage" } as const)[test.grading_policy]),
        },
  );
  if (test.cooldown_minutes > 0 && test.max_attempts !== 1) {
    rules.push({ key: "cooldown", icon: <TimerReset className={icon} />, text: t("ruleCooldown", { minutes: tc("minutes", { count: test.cooldown_minutes }) }) });
  }

  return (
    <section aria-labelledby="test-rules-title" className="flex flex-col gap-3">
      <h3 id="test-rules-title" className="text-[17px] font-bold text-ink dark:text-slate-50">{t("beforeYouStart")}</h3>
      <ul className="flex flex-col gap-2.5">
        {rules.map((rule, index) => (
          <m.li
            key={rule.key}
            className="flex items-start gap-2.5 text-sm leading-7 text-slate-700 dark:text-slate-300"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.05, duration: 0.3 }}
          >
            <span className="flex pt-1.5 text-brand-600 dark:text-brand-300" aria-hidden="true">{rule.icon}</span>
            {rule.text}
          </m.li>
        ))}
      </ul>
    </section>
  );
}

// ── Resume banner (Intro-Resume.dc.html) ─────────────────────────────────────

export function ResumeBanner({ test, onResume }: { test: CourseTestDetail; onResume: (attemptId: number) => void }) {
  const t = useTranslations("courseTests.intro");
  const open = test.open_attempt!;
  const remaining = useServerCountdown(open.deadline_at, open.server_now);
  const total = Math.max(1, test.question_count);
  const ratio = Math.min(100, Math.round((open.answered_count / total) * 100));
  const progress = t("resumeProgress", { answered: open.answered_count, total: test.question_count });

  return (
    <m.section
      aria-labelledby="resume-title"
      className="flex flex-col gap-4 rounded-[20px] border-2 border-ink bg-amber-50 p-5 shadow-[5px_5px_0_#0F172A] sm:flex-row sm:items-center sm:gap-5 sm:px-6 dark:border-amber-400/60 dark:bg-amber-500/10 dark:shadow-[5px_5px_0_rgba(251,191,36,0.35)]"
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-[14px] bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" aria-hidden="true">
        <Clock3 className="size-6" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h2 id="resume-title" className="text-[17px] font-bold text-ink dark:text-slate-50">{t("resumeTitle")}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <span
            role="progressbar"
            aria-label={progress}
            aria-valuemin={0}
            aria-valuemax={test.question_count}
            aria-valuenow={open.answered_count}
            className="h-1.5 w-full max-w-44 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900/60"
          >
            <m.span
              className="block h-full rounded-full bg-amber-700 dark:bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${ratio}%` }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
          <span className="text-[13px] tabular-nums text-amber-900 dark:text-amber-200">
            {progress}
            {remaining != null && <> · {t("resumeRemaining", { time: formatClock(remaining) })}</>}
          </span>
        </div>
      </div>
      <m.button
        type="button"
        onClick={() => onResume(open.id)}
        whileHover={{ y: -2 }}
        whileTap={{ y: 1 }}
        className={cn(
          "inline-flex min-h-12 shrink-0 cursor-pointer items-center justify-center gap-2.5 rounded-full border-2 border-ink bg-brand-700 px-6 text-[15px] font-bold text-white shadow-[3px_3px_0_#0F172A] transition-colors hover:bg-brand-900 dark:border-brand-300 dark:shadow-[3px_3px_0_#7dd3fc]",
          focusRing,
        )}
      >
        {t("resume")}
        <ArrowLeft className="size-[18px] ltr:-scale-x-100" aria-hidden="true" />
      </m.button>
    </m.section>
  );
}

// ── Attempts history ─────────────────────────────────────────────────────────

function StatusPill({ attempt }: { attempt: AttemptSummary }) {
  const t = useTranslations("courseTests.intro");
  const base = "inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums";
  if (attempt.status === "in_progress") return <span className={cn(base, "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300")}>{t("statusInProgress")}</span>;
  if (attempt.status === "pending_grading") return <span className={cn(base, "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300")}>{t("statusPending")}</span>;
  if (attempt.status === "submitted" || attempt.percent == null) return <span className={cn(base, "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>{t("statusSubmitted")}</span>;
  return attempt.passed
    ? <span className={cn(base, "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300")}>{t("statusPassed", { percent: attempt.percent })}</span>
    : <span className={cn(base, "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300")}>{t("statusFailed", { percent: attempt.percent })}</span>;
}

export function AttemptsTable({
  test,
  onResume,
  onOpenResult,
  onOpenReview,
}: {
  test: CourseTestDetail;
  onResume: (attemptId: number) => void;
  onOpenResult: (attemptId: number) => void;
  onOpenReview: (attemptId: number) => void;
}) {
  const t = useTranslations("courseTests.intro");
  const locale = useLocale();
  const attempts = [...test.attempts].sort((a, b) => b.number - a.number);
  const policy = ({ highest: "policyHighest", last: "policyLast", average: "policyAverage" } as const)[test.grading_policy];
  const th = "px-3 py-3 text-start text-xs font-semibold text-muted first:ps-4 last:pe-4 sm:first:ps-5 dark:text-slate-400";
  const td = "px-3 py-3.5 first:ps-4 last:pe-4 sm:first:ps-5";

  return (
    <section aria-labelledby="attempts-title" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="attempts-title" className="text-[17px] font-bold text-ink dark:text-slate-50">{t("attemptsTitle")}</h3>
        {test.max_attempts !== 1 && <span className="text-[13px] text-muted dark:text-slate-400">{t(policy)}</span>}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[#E4E2DC] dark:border-slate-800">
        <table className="w-full min-w-[34rem] border-collapse text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60">
            <tr>
              <th scope="col" className={th}>{t("colAttempt")}</th>
              <th scope="col" className={th}>{t("colDate")}</th>
              <th scope="col" className={th}>{t("colDuration")}</th>
              <th scope="col" className={th}>{t("colScore")}</th>
              <th scope="col" className={th}>{t("colStatus")}</th>
              <th scope="col" className={th}><span className="sr-only">{t("colActions")}</span></th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => {
              const open = attempt.status === "in_progress";
              const hasResult = !open;
              const action = open ? () => onResume(attempt.id) : () => onOpenResult(attempt.id);
              const points = attempt.score_total;
              return (
                <tr
                  key={attempt.id}
                  onClick={action}
                  className="cursor-pointer border-t border-[#E4E2DC] transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                >
                  <td className={td}>
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); action(); }}
                      aria-label={open ? t("resumeAttempt", { number: attempt.number }) : t("openResult", { number: attempt.number })}
                      className={cn("-m-1 min-h-11 cursor-pointer rounded-lg p-1 text-start font-semibold text-ink hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-300", focusRing)}
                    >
                      {t("attemptN", { number: attempt.number })}
                    </button>
                  </td>
                  <td className={cn(td, "tabular-nums text-slate-600 dark:text-slate-300")}>{formatShortDate(attempt.started_at, locale)}</td>
                  <td className={cn(td, "tabular-nums text-slate-600 dark:text-slate-300")}>
                    {attempt.duration_seconds != null ? t("durationValue", { time: formatClock(attempt.duration_seconds) }) : "—"}
                  </td>
                  <td className={cn(td, "tabular-nums", points != null ? "font-bold text-ink dark:text-slate-50" : "text-slate-600 dark:text-slate-300")}>
                    {points != null ? <span dir="ltr">{points} / {attempt.max_score}</span> : "—"}
                  </td>
                  <td className={td}><StatusPill attempt={attempt} /></td>
                  <td className={td}>
                    {hasResult && attempt.can_review && (
                      <button
                        type="button"
                        onClick={(event) => { event.stopPropagation(); onOpenReview(attempt.id); }}
                        aria-label={t("reviewAttempt", { number: attempt.number })}
                        className={cn("inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-lg px-1 text-[13px] font-semibold text-brand-700 hover:text-brand-900 dark:text-brand-300 dark:hover:text-brand-200", focusRing)}
                      >
                        {t("review")}
                        <ChevronLeft className="size-3.5 ltr:-scale-x-100" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Availability window ──────────────────────────────────────────────────────

export function AvailabilityRow({ opensAt, closesAt }: { opensAt: string | null; closesAt: string | null }) {
  const t = useTranslations("courseTests.intro");
  const locale = useLocale();
  if (!opensAt && !closesAt) return null;
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-[#E4E2DC] bg-slate-50 px-4 py-3.5 dark:border-slate-800 dark:bg-slate-800/50">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" aria-hidden="true">
        <CalendarDays className="size-[15px]" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {opensAt ? (
          <>
            <span className="text-sm font-semibold tabular-nums text-ink dark:text-slate-100">{t("availableFrom", { date: formatTestDate(opensAt, locale) })}</span>
            {closesAt && <span className="text-xs tabular-nums text-muted dark:text-slate-400">{t("closesAt", { date: formatTestDate(closesAt, locale) })}</span>}
          </>
        ) : (
          <span className="text-sm font-semibold tabular-nums text-ink dark:text-slate-100">{t("closesAtOnly", { date: formatTestDate(closesAt!, locale) })}</span>
        )}
      </div>
    </div>
  );
}

// ── "العنصر X من Y" footer ───────────────────────────────────────────────────

export function ItemFooter({ test }: { test: CourseTestDetail }) {
  const t = useTranslations("courseTests.intro");
  const nav = cn(
    "inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#E4E2DC] px-3.5 text-sm font-semibold transition-colors dark:border-slate-700",
    focusRing,
  );
  const enabled = "bg-white text-ink hover:bg-[#F4F3EF] dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800";
  const disabled = "cursor-not-allowed bg-slate-50 text-slate-400 dark:bg-slate-800/40 dark:text-slate-500";

  return (
    <nav aria-label={t("itemOf", { current: test.item_index, total: test.item_count })} className={cn(cardClass, "flex flex-wrap items-center justify-between gap-4 rounded-[20px] px-5 py-4 sm:px-6")}>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs tabular-nums text-muted dark:text-slate-400">{t("itemOf", { current: test.item_index, total: test.item_count })}</span>
        <span className="truncate text-[17px] font-bold text-ink dark:text-slate-50">{test.title}</span>
        {test.lesson_title && <span className="text-xs text-brand-700 dark:text-brand-300">{test.lesson_title}</span>}
      </div>
      <div className="flex gap-2">
        {test.prev_item ? (
          <Link href={courseItemHref(test.course_id, test.prev_item)} aria-label={t("prevItem", { title: test.prev_item.title })} className={cn(nav, enabled)}>
            <ChevronRight className="size-4 ltr:-scale-x-100" aria-hidden="true" />
            {t("prev")}
          </Link>
        ) : (
          <button type="button" disabled className={cn(nav, disabled)}>
            <ChevronRight className="size-4 ltr:-scale-x-100" aria-hidden="true" />
            {t("prev")}
          </button>
        )}
        {test.next_item ? (
          <Link href={courseItemHref(test.course_id, test.next_item)} aria-label={t("nextItem", { title: test.next_item.title })} className={cn(nav, enabled)}>
            {t("next")}
            <ChevronLeft className="size-4 ltr:-scale-x-100" aria-hidden="true" />
          </Link>
        ) : (
          <button type="button" disabled className={cn(nav, disabled)}>
            {t("next")}
            <ChevronLeft className="size-4 ltr:-scale-x-100" aria-hidden="true" />
          </button>
        )}
      </div>
    </nav>
  );
}

