"use client";

import { TriangleAlert, CircleAlert, Clock3, CloudCheck, LoaderCircle, RotateCw, WifiOff } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { cn } from "@/src/lib/cn";
import { formatClock } from "../format";
import type { AutosaveStatus } from "./autosave-queue";
import { focusRing, muted } from "./styles";

/** Header autosave indicator with a crossfade between states. */
export function SaveStatus({ status, className }: { status: AutosaveStatus; className?: string }) {
  const t = useTranslations("courseTests.attempt.save");
  const view = {
    saved: { icon: CloudCheck, tone: "text-green-700 dark:text-green-400", spin: false },
    saving: { icon: LoaderCircle, tone: "text-slate-500 dark:text-slate-400", spin: true },
    retrying: { icon: LoaderCircle, tone: "text-red-700 dark:text-red-400", spin: true },
    error: { icon: CircleAlert, tone: "text-red-700 dark:text-red-400", spin: false },
    closed: { icon: Clock3, tone: "text-slate-500 dark:text-slate-400", spin: false },
  }[status];
  const Icon = view.icon;
  return (
    <span className={cn("relative inline-flex min-h-5 items-center", className)}>
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className={cn("inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold", view.tone)}
        >
          <Icon aria-hidden="true" className={cn("size-4 shrink-0", view.spin && "animate-spin")} />
          {t(status)}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

/** Desktop timer card (Question.dc.html / Question-Warning.dc.html). */
export function TimerCard({ remaining, totalSeconds, warning }: { remaining: number; totalSeconds: number; warning: boolean }) {
  const t = useTranslations("courseTests.attempt.timer");
  const reduce = useReducedMotion();
  const percent = totalSeconds > 0 ? Math.min(100, (remaining / totalSeconds) * 100) : 0;
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-[20px] border-2 border-slate-900 px-5 py-[18px] transition-[background-color,box-shadow] duration-500 dark:border-sky-300",
        warning ? "bg-red-50 shadow-[5px_5px_0_#B91C1C] dark:bg-red-950/50" : "bg-white shadow-[5px_5px_0_#0F172A] dark:bg-slate-900 dark:shadow-[5px_5px_0_#020617]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-semibold", warning ? "text-red-700 dark:text-red-300" : "text-slate-900 dark:text-slate-100")}>
          {warning ? <TriangleAlert aria-hidden="true" className="size-4" /> : <Clock3 aria-hidden="true" className="size-4" />}
          {warning ? t("warning") : t("label")}
        </span>
        <span className={cn("text-xs tabular-nums", muted)}>{t("total", { time: formatClock(totalSeconds) })}</span>
      </div>
      <m.span
        role="timer"
        aria-live="off"
        aria-label={t("aria", { time: formatClock(remaining) })}
        animate={warning && !reduce ? { scale: [1, 1.04, 1] } : { scale: 1 }}
        transition={warning && !reduce ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        className={cn("self-start text-[42px] font-bold leading-[1.1] tabular-nums", warning ? "text-red-700 dark:text-red-300" : "text-slate-900 dark:text-white")}
      >
        {formatClock(remaining)}
      </m.span>
      <div className={cn("h-1.5 overflow-hidden rounded-full", warning ? "bg-red-200 dark:bg-red-900/60" : "bg-slate-200 dark:bg-slate-800")}>
        <div
          className={cn("h-full rounded-full transition-[width,background-color] duration-1000 ease-linear", warning ? "bg-red-500" : "bg-sky-600 dark:bg-sky-400")}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** Compact timer pill for the mobile sticky header (Mobile-Question.dc.html). */
export function TimerPill({ remaining, warning }: { remaining: number; warning: boolean }) {
  const t = useTranslations("courseTests.attempt.timer");
  const reduce = useReducedMotion();
  return (
    <m.span
      role="timer"
      aria-live="off"
      aria-label={t("aria", { time: formatClock(remaining) })}
      animate={warning && !reduce ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={warning && !reduce ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-3 text-[15px] font-bold tabular-nums shadow-[2px_2px_0_#0F172A] dark:shadow-[2px_2px_0_#020617]",
        warning
          ? "border-red-700 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950/60 dark:text-red-300"
          : "border-slate-900 bg-white text-slate-900 dark:border-sky-300 dark:bg-slate-900 dark:text-white",
      )}
    >
      {warning ? <TriangleAlert aria-hidden="true" className="size-[15px]" /> : <Clock3 aria-hidden="true" className="size-[15px]" />}
      {formatClock(remaining)}
    </m.span>
  );
}

/** < 2 minutes banner (Question-Warning.dc.html). */
export function TimeWarningBanner({ unansweredCount }: { unansweredCount: number }) {
  const t = useTranslations("courseTests.attempt");
  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border-[1.5px] border-red-300 bg-red-50 px-4 py-3.5 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
    >
      <TriangleAlert aria-hidden="true" className="size-[18px] shrink-0" />
      <span className="min-w-0 flex-1 text-sm font-semibold">{t("warningBanner")}</span>
      {unansweredCount > 0 ? <span className="text-[13px] tabular-nums">{t("unansweredCount", { count: unansweredCount })}</span> : null}
    </m.div>
  );
}

/** Failed-save toast with retry (Question-Warning.dc.html). */
export function SaveErrorToast({ open, retrying, onRetry }: { open: boolean; retrying: boolean; onRetry: () => void }) {
  const t = useTranslations("courseTests.attempt.toast");
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center md:bottom-28 lg:bottom-8">
      <AnimatePresence>
        {open ? (
          <m.div
            role="status"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex max-w-2xl flex-wrap items-center gap-x-3.5 gap-y-2 rounded-2xl bg-slate-900 py-3 pe-3.5 ps-5 text-slate-50 shadow-[5px_5px_0_#EF4444] dark:bg-slate-800 dark:ring-1 dark:ring-slate-700"
          >
            <WifiOff aria-hidden="true" className="size-[18px] shrink-0 text-red-300" />
            <span className="min-w-0 flex-1 text-sm leading-relaxed">{t("message")}</span>
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-full border-[1.5px] border-slate-50 px-3.5 text-[13px] font-semibold text-slate-50 transition-colors hover:bg-white/10 disabled:opacity-60 sm:min-h-9",
                focusRing,
              )}
            >
              <RotateCw aria-hidden="true" className={cn("size-3.5", retrying && "animate-spin")} />
              {t("retry")}
            </button>
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
