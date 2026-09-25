"use client";

import { AnimatePresence, m } from "motion/react";
import { ArrowLeft, CalendarDays, Check, ChevronLeft, ClipboardCheck, LockKeyhole, PenLine } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/cn";
import { formatClock, formatTestDate } from "../format";
import { testHref } from "../routes";
import type { SidebarTestItem } from "../types";
import { useServerCountdown } from "./use-server-countdown";

type IntroT = ReturnType<typeof useTranslations<"courseTests.intro">>;
type CommonT = ReturnType<typeof useTranslations<"courseTests.common">>;

export function sidebarTestHref(courseId: number, test: SidebarTestItem) {
  return test.state === "in_progress" && test.open_attempt
    ? testHref(courseId, test.id, { attempt: test.open_attempt.id, view: "attempt" })
    : testHref(courseId, test.id);
}

/** "اختبار · 10 أسئلة · 15 دقيقة" */
export function defaultSubtitle(test: SidebarTestItem, tc: CommonT) {
  return [
    tc("test"),
    tc("questions", { count: test.question_count }),
    test.time_limit_minutes ? tc("minutes", { count: test.time_limit_minutes }) : null,
  ].filter(Boolean).join(" · ");
}

/** Subtitle copy for every state in spec §3.1, built client-side from the state. */
export function sidebarSubtitle(test: SidebarTestItem, t: IntroT, tc: CommonT, locale: string) {
  switch (test.state) {
    case "locked":
      return test.prerequisite_title
        ? t("sidebar.lockedAfter", { title: test.prerequisite_title })
        : t("sidebar.lockedHint");
    case "scheduled":
      return test.opens_at ? t("sidebar.opensAt", { date: formatTestDate(test.opens_at, locale) }) : t("sidebar.scheduled");
    case "passed":
      if (test.attempt_count <= 1) return t("sidebar.passedFirst");
      return test.grading_policy === "last" ? t("sidebar.passedLast", { count: test.attempt_count })
        : test.grading_policy === "average" ? t("sidebar.passedAverage", { count: test.attempt_count })
        : t("sidebar.passedBest", { count: test.attempt_count });
    case "failed":
      return test.max_attempts === null
        ? t("sidebar.failedUnlimited")
        : t("sidebar.failedLeft", { count: Math.max(0, test.max_attempts - test.attempt_count) });
    case "attempts_exhausted":
      return t("sidebar.exhausted", { used: test.attempt_count, max: test.max_attempts ?? test.attempt_count });
    case "pending_grading":
      return t("sidebar.pending");
    case "closed":
      return t("sidebar.closedHint");
    default:
      return defaultSubtitle(test, tc);
  }
}

const tileTone: Record<SidebarTestItem["state"], string> = {
  not_started: "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300",
  locked: "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
  scheduled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  in_progress: "bg-white text-brand-700 ring-1 ring-brand-200 dark:bg-slate-900 dark:text-brand-300 dark:ring-brand-900",
  passed: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  attempts_exhausted: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  pending_grading: "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300",
  closed: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

function StateIcon({ state, className }: { state: SidebarTestItem["state"]; className?: string }) {
  if (state === "scheduled") return <CalendarDays className={className} aria-hidden="true" />;
  if (state === "pending_grading") return <PenLine className={className} aria-hidden="true" />;
  if (state === "closed") return <LockKeyhole className={className} aria-hidden="true" />;
  return <ClipboardCheck className={className} aria-hidden="true" />;
}

const pill = "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums";

/** Trailing badge. Every colored badge also carries text, so color is never the only signal. */
function StateBadge({ test, compact = false }: { test: SidebarTestItem; compact?: boolean }) {
  const t = useTranslations("courseTests.intro");
  const size = compact ? "px-2 text-[11px]" : "";
  const percent = test.percent;
  const key = `${test.state}-${percent ?? ""}`;

  let badge: React.ReactNode;
  switch (test.state) {
    case "not_started":
      badge = (
        <span className="flex shrink-0 items-center text-muted dark:text-slate-400">
          <span className="sr-only">{t("sidebar.notStarted")}</span>
          <ChevronLeft className="size-4 ltr:-scale-x-100" aria-hidden="true" />
        </span>
      );
      break;
    case "locked":
      badge = (
        <span className="flex shrink-0 items-center text-slate-400 dark:text-slate-500">
          <span className="sr-only">{t("sidebar.locked")}</span>
          <LockKeyhole className="size-4" aria-hidden="true" />
        </span>
      );
      break;
    case "scheduled":
      badge = <span className={cn(pill, size, "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>{t("sidebar.scheduled")}</span>;
      break;
    case "in_progress":
      badge = <span className={cn(pill, size, "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300")}>{t("sidebar.inProgress")}</span>;
      break;
    case "pending_grading":
      badge = <span className={cn(pill, size, "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300")}>{t("sidebar.pendingBadge")}</span>;
      break;
    case "closed":
      badge = <span className={cn(pill, size, "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300")}>{t("sidebar.closed")}</span>;
      break;
    case "passed":
      badge = (
        <span className={cn(pill, size, "bg-green-100 font-bold text-green-700 dark:bg-green-500/15 dark:text-green-300")} aria-label={percent != null ? t("sidebar.passedBadge", { percent }) : undefined}>
          <Check className="size-3.5 stroke-[3]" aria-hidden="true" />
          {percent != null ? `${percent}%` : null}
        </span>
      );
      break;
    case "failed":
      badge = percent != null ? (
        <span className={cn(pill, size, "bg-red-100 font-bold text-red-700 dark:bg-red-500/15 dark:text-red-300")} aria-label={t("sidebar.failedBadge", { percent })}>{percent}%</span>
      ) : null;
      break;
    case "attempts_exhausted":
      badge = percent != null ? (
        <span className={cn(pill, size, "border-[1.5px] border-red-300 font-bold text-red-700 dark:border-red-500/60 dark:text-red-300")} aria-label={t("sidebar.failedBadge", { percent })}>{percent}%</span>
      ) : null;
      break;
  }

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <m.span
        key={key}
        className="flex shrink-0"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.18 }}
      >
        {badge}
      </m.span>
    </AnimatePresence>
  );
}

function InProgressMeter({ test, compact = false }: { test: SidebarTestItem; compact?: boolean }) {
  const t = useTranslations("courseTests.intro");
  const open = test.open_attempt;
  const remaining = useServerCountdown(open?.deadline_at, open?.server_now);
  if (!open) return null;
  const total = Math.max(1, test.question_count);
  const ratio = Math.min(100, Math.round((open.answered_count / total) * 100));
  const text = remaining != null
    ? t("sidebar.progress", { answered: open.answered_count, total: test.question_count, time: formatClock(remaining) })
    : t("sidebar.progressNoLimit", { answered: open.answered_count, total: test.question_count });

  if (compact) return <span className="shrink-0 text-xs tabular-nums text-slate-600 dark:text-slate-300">{text}</span>;
  return (
    <span className="flex items-center gap-2.5">
      <span
        role="progressbar"
        aria-label={t("sidebar.progressLabel", { answered: open.answered_count, total: test.question_count })}
        aria-valuemin={0}
        aria-valuemax={test.question_count}
        aria-valuenow={open.answered_count}
        className="h-[5px] flex-1 overflow-hidden rounded-full bg-brand-100 dark:bg-slate-800"
      >
        <m.span
          className="block h-full rounded-full bg-brand-600 dark:bg-brand-400"
          initial={{ width: 0 }}
          animate={{ width: `${ratio}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
      <span className="shrink-0 text-xs tabular-nums text-slate-600 dark:text-slate-300">{text}</span>
    </span>
  );
}

/** Test as its own row in a lesson's item list (Main.dc.html, standalone states). */
export function SidebarTestRow({ test, courseId, selected }: { test: SidebarTestItem; courseId: number; selected: boolean }) {
  const t = useTranslations("courseTests.intro");
  const tc = useTranslations("courseTests.common");
  const locale = useLocale();
  const muted = test.state === "locked";

  return (
    <Link
      href={sidebarTestHref(courseId, test)}
      data-testid={`learner-curriculum-test-${test.id}`}
      data-state={test.state}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "group flex min-h-11 w-full flex-col gap-2.5 px-3 py-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0A5FB4]",
        selected
          ? "bg-[#E8F1FB] shadow-[inset_0_0_0_1.5px_#0A5FB4] dark:bg-brand-900/30"
          : "bg-white hover:bg-[#FAF9F5] dark:bg-slate-900 dark:hover:bg-slate-800/70",
      )}
    >
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "grid size-[34px] shrink-0 place-items-center rounded-[10px] transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0",
            selected ? "bg-white text-brand-700 ring-1 ring-brand-200 dark:bg-slate-900 dark:text-brand-300 dark:ring-brand-800" : tileTone[test.state],
          )}
        >
          <StateIcon state={test.state} className="size-[18px]" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className={cn("block truncate text-sm font-semibold", muted ? "text-slate-500 dark:text-slate-400" : "text-[#15181E] dark:text-slate-100")}>
            {test.title}
          </strong>
          <span className="block truncate text-xs tabular-nums text-muted dark:text-slate-400">
            {sidebarSubtitle(test, t, tc, locale)}
          </span>
        </span>
        <StateBadge test={test} />
        {selected && <span className="sr-only">{t("sidebar.selected")}</span>}
      </span>
      {test.state === "in_progress" && <InProgressMeter test={test} />}
    </Link>
  );
}

/** Compact sub-row inside a content item, next to its video / file (placement = inside_item). */
export function SidebarTestSubRow({ test, courseId, selected }: { test: SidebarTestItem; courseId: number; selected: boolean }) {
  const t = useTranslations("courseTests.intro");
  const tc = useTranslations("courseTests.common");
  const locale = useLocale();
  const locked = test.state === "locked";
  const iconTone = locked || test.state === "closed" || test.state === "scheduled"
    ? "text-slate-400 dark:text-slate-500"
    : test.state === "passed"
      ? "text-green-700 dark:text-green-300"
      : test.state === "failed" || test.state === "attempts_exhausted"
        ? "text-red-700 dark:text-red-300"
        : "text-brand-700 dark:text-brand-300";

  let trailing: React.ReactNode;
  if (test.state === "not_started") {
    trailing = (
      <>
        <span className="shrink-0 text-xs tabular-nums text-muted dark:text-slate-400">{tc("questions", { count: test.question_count })}</span>
        <ArrowLeft className="size-4 shrink-0 text-brand-600 ltr:-scale-x-100 dark:text-brand-300" aria-hidden="true" />
      </>
    );
  } else if (locked) {
    trailing = <span className="min-w-0 max-w-[55%] truncate text-xs text-muted dark:text-slate-400">{sidebarSubtitle(test, t, tc, locale)}</span>;
  } else if (test.state === "in_progress") {
    trailing = (
      <>
        <InProgressMeter test={test} compact />
        <StateBadge test={test} compact />
      </>
    );
  } else {
    trailing = <StateBadge test={test} compact />;
  }

  return (
    <Link
      href={sidebarTestHref(courseId, test)}
      data-testid={`learner-curriculum-test-${test.id}`}
      data-state={test.state}
      data-compact
      aria-current={selected ? "page" : undefined}
      aria-label={`${test.title} · ${sidebarSubtitle(test, t, tc, locale)}`}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7]",
        selected ? "bg-[#E8F1FB] shadow-[inset_0_0_0_1px_#0A5FB4] dark:bg-brand-900/30" : "hover:bg-white dark:hover:bg-slate-800",
      )}
    >
      {locked
        ? <LockKeyhole className={cn("size-4 shrink-0", iconTone)} aria-hidden="true" />
        : <StateIcon state={test.state} className={cn("size-4 shrink-0", iconTone)} />}
      <span className={cn("min-w-0 flex-1 truncate font-bold", locked ? "text-slate-500 dark:text-slate-400" : "text-[#15181E] dark:text-slate-100")}>{test.title}</span>
      {trailing}
    </Link>
  );
}
