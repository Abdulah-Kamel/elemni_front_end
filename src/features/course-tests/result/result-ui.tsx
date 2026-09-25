"use client";

import { useEffect, useState, type ReactNode } from "react";
import { animate, m, useMotionValue, useMotionValueEvent, useReducedMotion, type Variants } from "motion/react";
import { ArrowLeft, FileText, ClipboardCheck, BookOpen, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/cn";
import { courseItemHref } from "../routes";
import type { CourseItemRef } from "../types";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const cardClass = "rounded-3xl border border-slate-200 bg-white text-slate-900 dark:border-border dark:bg-surface dark:text-slate-50";

const focusRing = "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:focus-visible:outline-sky-300";

export const primaryButtonClass = cn(
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border-2 border-slate-900 bg-sky-700 px-6 text-[15px] font-bold text-white shadow-[3px_3px_0_#0F172A] transition-[background-color,box-shadow,translate] hover:bg-sky-800 active:translate-y-px active:shadow-[1px_1px_0_#0F172A] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
  "dark:border-sky-200 dark:bg-sky-300 dark:text-[#0B132B] dark:shadow-[3px_3px_0_#020617] dark:hover:bg-sky-200",
  focusRing,
);

export const secondaryButtonClass = cn(
  "inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border-2 border-slate-900 bg-white px-6 text-[15px] font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none",
  "dark:border-slate-600 dark:bg-transparent dark:text-slate-50 dark:hover:bg-surface-muted",
  focusRing,
);

export const quietButtonClass = cn(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
  "dark:border-border dark:bg-surface dark:text-slate-50 dark:hover:bg-surface-muted",
  focusRing,
);

export const staggerContainer: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } } };
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/** Animated integer that announces nothing; pair it with visually hidden final text. */
export function CountUp({ value, suffix = "", delay = 0 }: { value: number; suffix?: string; delay?: number }) {
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(reduce ? value : 0);
  const [text, setText] = useState(() => `${reduce ? value : 0}${suffix}`);

  useMotionValueEvent(motionValue, "change", (latest) => setText(`${Math.round(latest)}${suffix}`));

  useEffect(() => {
    if (reduce) {
      motionValue.jump(value);
      return;
    }
    const controls = animate(motionValue, value, { duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, motionValue, reduce, delay]);

  return <span aria-hidden="true">{text}</span>;
}

export type RingTone = "passed" | "failed" | "neutral";

const ringTones: Record<RingTone, { track: string; bar: string }> = {
  passed: { track: "stroke-green-100 dark:stroke-green-900", bar: "stroke-green-500 dark:stroke-green-400" },
  failed: { track: "stroke-red-100 dark:stroke-red-950", bar: "stroke-red-500 dark:stroke-red-400" },
  neutral: { track: "stroke-sky-100 dark:stroke-sky-950", bar: "stroke-sky-600 dark:stroke-sky-400" },
};

/** Score ring (viewBox 160, r 64) that draws itself from 0 to `percent`. */
export function ScoreRing({
  percent,
  tone,
  strokeWidth = 14,
  className,
  children,
}: {
  percent: number;
  tone: RingTone;
  strokeWidth?: number;
  className?: string;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const fraction = Math.min(1, Math.max(0, percent / 100));
  const colors = ringTones[tone];
  return (
    <div className={cn("relative shrink-0", className)}>
      <svg viewBox="0 0 160 160" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="80" cy="80" r="64" fill="none" strokeWidth={strokeWidth} className={colors.track} />
        {fraction > 0 ? (
          <m.circle
            cx="80"
            cy="80"
            r="64"
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className={colors.bar}
            initial={reduce ? false : { pathLength: 0 }}
            animate={{ pathLength: fraction }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">{children}</div>
    </div>
  );
}

/** Pass/fail sticker that pops onto the ring once it has drawn. */
export function OutcomePill({ passed, label, className }: { passed: boolean; label: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <m.span
      className={cn(
        "absolute rounded-full border-2 px-3 py-1 text-[13px] font-bold shadow-[2px_2px_0_#0F172A] dark:shadow-[2px_2px_0_#020617]",
        passed
          ? "border-slate-900 bg-green-500 text-green-950 dark:border-slate-50 dark:bg-green-400"
          : "border-slate-900 bg-red-100 text-red-800 dark:border-slate-50 dark:bg-red-400 dark:text-red-950",
        className,
      )}
      initial={reduce ? false : { scale: 0, rotate: 12, opacity: 0 }}
      animate={{ scale: 1, rotate: -8, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 16, delay: reduce ? 0 : 0.95 }}
    >
      {label}
    </m.span>
  );
}

const sparkles = [
  { className: "-top-2 start-6 size-3.5", delay: 1.05 },
  { className: "top-10 -end-4 size-2.5", delay: 1.15 },
  { className: "bottom-4 -start-3 size-3", delay: 1.25 },
  { className: "-bottom-1 end-10 size-2", delay: 1.35 },
];

/** A light, library-free celebration: a few sparkles twinkle around the ring. */
export function PassSparkles() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <>
      {sparkles.map((sparkle, index) => (
        <m.svg
          key={index}
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={cn("pointer-events-none absolute fill-amber-400 dark:fill-amber-300", sparkle.className)}
          initial={{ scale: 0, opacity: 0, rotate: -30 }}
          animate={{ scale: [0, 1.35, 1], opacity: [0, 1, 0.85], rotate: 0 }}
          transition={{ duration: 0.7, delay: sparkle.delay, ease: EASE_OUT }}
        >
          <path d="M12 0c.6 5.4 3 9 12 12-9 3-11.4 6.6-12 12C11.4 18.6 9 15 0 12 9 9 11.4 5.4 12 0Z" />
        </m.svg>
      ))}
    </>
  );
}

export type StatTile = { key: string; label: string; shortLabel: string; value: string; tone: "correct" | "wrong" | "neutral" };

const tileTones = {
  correct: { box: "bg-green-50", label: "text-green-700 dark:text-green-300" },
  wrong: { box: "bg-red-50", label: "text-red-700 dark:text-red-300" },
  neutral: { box: "bg-slate-100", label: "text-slate-600 dark:text-slate-400" },
};

export function StatTiles({ tiles, label }: { tiles: StatTile[]; label: string }) {
  return (
    <m.dl
      aria-label={label}
      className="grid w-full grid-cols-2 gap-2.5 text-start @xl:grid-cols-4 @xl:gap-3"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {tiles.map((tile) => (
        <m.div
          key={tile.key}
          variants={staggerItem}
          className={cn(
            "flex flex-col gap-1 rounded-[14px] p-3.5 @xl:p-4 dark:border dark:border-border dark:bg-surface-muted",
            tileTones[tile.tone].box,
          )}
        >
          <dt className={cn("text-xs @xl:text-[13px]", tileTones[tile.tone].label)}>
            <span className="@xl:hidden">{tile.shortLabel}</span>
            <span className="hidden @xl:inline">{tile.label}</span>
          </dt>
          <dd className="text-[22px] font-bold tabular-nums @xl:text-2xl">{tile.value}</dd>
        </m.div>
      ))}
    </m.dl>
  );
}

export function ItemKindIcon({ kind, className }: { kind: CourseItemRef["kind"]; className?: string }) {
  const Icon = kind === "video" ? Video : kind === "file" ? FileText : kind === "test" ? ClipboardCheck : BookOpen;
  return <Icon className={cn("size-[18px]", className)} aria-hidden="true" />;
}

/** Forward arrow: points left in RTL, right in LTR. */
export function ForwardArrow({ className }: { className?: string }) {
  return <ArrowLeft className={cn("size-[18px] ltr:rotate-180", className)} aria-hidden="true" />;
}

export function ContinueLink({ courseId, item, variant = "primary" }: { courseId: number; item: CourseItemRef; variant?: "primary" | "secondary" }) {
  const t = useTranslations("courseTests.result");
  return (
    <Link href={courseItemHref(courseId, item)} className={cn(variant === "primary" ? primaryButtonClass : secondaryButtonClass, "w-full no-underline @xl:w-auto")}>
      <span className="truncate">{t("continueTo", { title: item.title })}</span>
      <ForwardArrow />
    </Link>
  );
}

/** Mobile-only "next in the course" card from Mobile-Result. */
export function NextItemCard({ item }: { item: CourseItemRef }) {
  const t = useTranslations("courseTests.result");
  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border-2 border-sky-600 bg-white p-3.5 text-start shadow-[4px_4px_0_#0F172A] @xl:hidden dark:border-sky-400 dark:bg-surface dark:shadow-[4px_4px_0_#020617]">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-sky-700 dark:bg-surface-muted dark:text-sky-300">
        <ItemKindIcon kind={item.kind} />
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs text-slate-500 dark:text-slate-400">{t("nextInCourse")}</span>
        <span className="truncate text-sm font-semibold">{item.title}</span>
      </span>
    </div>
  );
}

export function formatDayTime(iso: string, locale: string) {
  const date = new Date(iso);
  const tag = locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
  const day = new Intl.DateTimeFormat(tag, { day: "2-digit", month: "2-digit" }).format(date);
  const time = new Intl.DateTimeFormat(tag, { hour: "numeric", minute: "2-digit", hour12: true }).format(date);
  return `${day} · ${time}`;
}
