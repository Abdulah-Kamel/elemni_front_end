"use client";

import { useEffect, useState } from "react";
import { m, type Variants } from "motion/react";
import { ArrowLeft, CalendarClock, Check, CircleAlert, ClipboardCheck, Hourglass, LockKeyhole, PenLine, Ban } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/cn";
import { formatClock, formatTestDate } from "../format";
import { useInvalidateCourseTests } from "../hooks";
import { courseItemHref } from "../routes";
import type { CourseTestDetail } from "../types";
import { useServerCountdown } from "../sidebar/use-server-countdown";
import { AttemptsTable, AvailabilityRow, ItemFooter, ResumeBanner, RulesList, StatTiles, cardClass, focusRing } from "./intro-parts";
import { startBlock, type StartBlock } from "./start-gate";

type Props = {
  test: CourseTestDetail;
  starting: boolean;
  startError: string | null;
  onStart: () => void;
  onResume: (attemptId: number) => void;
  onOpenResult: (attemptId: number) => void;
  onOpenReview: (attemptId: number) => void;
};

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

/** Intro / Intro-Resume / Locked designs, plus scheduled, closed, cooldown, exhausted and pending states. */
export function TestStartScreen(props: Props) {
  const { test } = props;
  const cooldownRemaining = useServerCountdown(test.next_attempt_at, test.server_now);
  const block = startBlock(test, cooldownRemaining);

  return (
    <m.div className="flex flex-col gap-4" initial="hidden" animate="show" variants={stagger} data-testid="test-start-screen" data-block={block ?? "none"}>
      {block === "locked" || block === "scheduled" ? (
        <m.div variants={rise}>
          <GateView test={test} kind={block} />
        </m.div>
      ) : (
        <>
          {block === "in_progress" && test.open_attempt && (
            <ResumeBanner test={test} onResume={props.onResume} />
          )}
          <IntroCard {...props} block={block} cooldownRemaining={cooldownRemaining} />
        </>
      )}
      <m.div variants={rise}>
        <ItemFooter test={test} />
      </m.div>
    </m.div>
  );
}

function IntroCard({ block, cooldownRemaining, ...props }: Props & { block: StartBlock | null; cooldownRemaining: number | null }) {
  const { test } = props;
  const t = useTranslations("courseTests.intro");
  const hasAttempts = test.attempts.length > 0;

  return (
    <m.section variants={stagger} aria-labelledby="test-title" className={cn(cardClass, "flex flex-col gap-7 p-5 sm:p-8")}>
      <m.div variants={rise} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-[18px] border-2 border-ink bg-brand-100 text-brand-700 shadow-[3px_3px_0_#0F172A] sm:size-16 dark:border-brand-300 dark:bg-brand-900/50 dark:text-brand-300 dark:shadow-[3px_3px_0_#7dd3fc]"
          aria-hidden="true"
        >
          <ClipboardCheck className="size-7 sm:size-[30px]" />
        </span>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border-[1.5px] border-ink px-2.5 py-0.5 text-xs font-bold text-ink dark:border-slate-300 dark:text-slate-100">
              {t("testPill")}
            </span>
            <span className="text-[13px] tabular-nums text-muted dark:text-slate-400">
              {[t("itemOf", { current: test.item_index, total: test.item_count }), test.lesson_title].filter(Boolean).join(" · ")}
            </span>
          </div>
          <h2 id="test-title" className="text-balance text-2xl font-bold text-ink sm:text-[28px] dark:text-slate-50">{test.title}</h2>
          {test.description && (
            <p className="max-w-[560px] text-[15px] leading-[1.9] text-slate-600 dark:text-slate-300">{test.description}</p>
          )}
        </div>
      </m.div>

      <m.div variants={rise}>
        <StatTiles test={test} />
      </m.div>

      {hasAttempts ? (
        <m.div variants={rise}>
          <AttemptsTable test={test} onResume={props.onResume} onOpenResult={props.onOpenResult} onOpenReview={props.onOpenReview} />
        </m.div>
      ) : (
        <m.div variants={rise}>
          <RulesList test={test} />
        </m.div>
      )}

      {block !== "in_progress" && (
        <m.div variants={rise}>
          <StartBar {...props} block={block} cooldownRemaining={cooldownRemaining} />
        </m.div>
      )}
    </m.section>
  );
}

function StartBar({ test, starting, startError, onStart, block, cooldownRemaining }: Props & { block: StartBlock | null; cooldownRemaining: number | null }) {
  const t = useTranslations("courseTests.intro");
  const [shake, setShake] = useState(0);
  const blocked = block !== null;
  const disabled = blocked || starting;
  const number = test.attempts.length + 1;
  const caption = blocked || test.max_attempts === null
    ? null
    : number === 1 ? t("firstAttemptOf", { max: test.max_attempts }) : t("attemptNOf", { number, max: test.max_attempts });

  return (
    <div className="flex flex-col gap-4 border-t border-dashed border-slate-300 pt-6 dark:border-slate-700">
      {block && <BlockNotice test={test} block={block} cooldownRemaining={cooldownRemaining} />}
      <div className="flex flex-wrap items-center gap-4">
        <m.button
          type="button"
          aria-disabled={disabled || undefined}
          aria-describedby={blocked ? "start-block-notice" : undefined}
          aria-busy={starting || undefined}
          onClick={() => {
            if (blocked) setShake((count) => count + 1);
            else if (!starting) onStart();
          }}
          whileHover={disabled ? undefined : { y: -2 }}
          whileTap={disabled ? undefined : { y: 1 }}
          className={cn(
            "inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-full px-7 text-base font-bold transition-colors",
            focusRing,
            blocked
              ? "cursor-not-allowed border-2 border-dashed border-slate-300 bg-slate-100 text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500"
              : "cursor-pointer border-2 border-ink bg-brand-700 text-white shadow-[3px_3px_0_#0F172A] hover:bg-brand-900 disabled:opacity-70 dark:border-brand-300 dark:shadow-[3px_3px_0_#7dd3fc]",
            starting && "cursor-progress opacity-80",
          )}
        >
          {blocked && (
            <m.span
              key={shake}
              className="flex"
              initial={false}
              animate={shake ? { rotate: [0, -16, 14, -10, 6, 0] } : undefined}
              transition={{ duration: 0.45 }}
              aria-hidden="true"
            >
              <LockKeyhole className="size-4" />
            </m.span>
          )}
          {starting ? t("starting") : number > 1 && !blocked ? t("startNew") : t("start")}
          {!blocked && <ArrowLeft className="size-[18px] ltr:-scale-x-100" aria-hidden="true" />}
        </m.button>
        {caption && <span className="text-[13px] tabular-nums text-muted dark:text-slate-400">{caption}</span>}
      </div>
      {startError && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-300">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {startError}
        </p>
      )}
    </div>
  );
}

/** Why Start is unavailable (cooldown, exhausted, pending grading, closed). */
function BlockNotice({ test, block, cooldownRemaining }: { test: CourseTestDetail; block: StartBlock; cooldownRemaining: number | null }) {
  const t = useTranslations("courseTests.intro");
  const locale = useLocale();
  const invalidate = useInvalidateCourseTests();
  const cooldownOver = block === "cooldown" && cooldownRemaining === 0;
  useEffect(() => {
    if (cooldownOver) void invalidate();
  }, [cooldownOver, invalidate]);

  let icon = <CircleAlert className="size-5" />;
  let tone = "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200";
  let text: React.ReactNode = t("startBlocked");

  switch (block) {
    case "cooldown":
      icon = <Hourglass className="size-5" />;
      tone = "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";
      text = (
        <>
          {t("cooldownNotice", { date: formatTestDate(test.next_attempt_at!, locale) })}
          {cooldownRemaining != null && cooldownRemaining > 0 && (
            <span className="ms-1 font-bold tabular-nums">· {t("cooldownIn", { time: formatClock(cooldownRemaining) })}</span>
          )}
        </>
      );
      break;
    case "attempts_exhausted":
      icon = <Ban className="size-5" />;
      tone = "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-500/10 dark:text-red-200";
      text = t("exhaustedNotice", { used: test.attempts.length, max: test.max_attempts ?? test.attempts.length });
      break;
    case "no_attempts_left":
      icon = <Check className="size-5" />;
      tone = "border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-500/10 dark:text-green-200";
      text = test.state === "passed"
        ? t("passedNoAttempts")
        : t("exhaustedNotice", { used: test.attempts.length, max: test.max_attempts ?? test.attempts.length });
      break;
    case "pending_grading":
      icon = <PenLine className="size-5" />;
      tone = "border-brand-200 bg-brand-50 text-brand-900 dark:border-brand-900 dark:bg-brand-900/30 dark:text-brand-200";
      text = t("pendingNotice");
      break;
    case "closed":
      icon = <LockKeyhole className="size-5" />;
      text = (
        <>
          {t("closedNotice")}
          {test.closes_at && <span className="ms-1 tabular-nums">({t("closedAt", { date: formatTestDate(test.closes_at, locale) })})</span>}
        </>
      );
      break;
  }

  return (
    <p id="start-block-notice" role="status" className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-7", tone)}>
      <span className="mt-1 shrink-0" aria-hidden="true">{icon}</span>
      <span>{text}</span>
    </p>
  );
}

/** Locked.dc.html, and the same layout for a scheduled test. */
function GateView({ test, kind }: { test: CourseTestDetail; kind: "locked" | "scheduled" }) {
  const t = useTranslations("courseTests.intro");
  const [shake, setShake] = useState(0);
  const invalidate = useInvalidateCourseTests();
  const opensIn = useServerCountdown(kind === "scheduled" ? test.opens_at : null, test.server_now);
  const opened = kind === "scheduled" && opensIn === 0;
  useEffect(() => {
    if (opened) void invalidate();
  }, [opened, invalidate]);

  const firstUnmet = test.prerequisites.find((item) => !item.met);
  const Icon = kind === "locked" ? LockKeyhole : CalendarClock;

  return (
    <section aria-labelledby="gate-title" className={cn(cardClass, "flex flex-col items-center gap-6 px-5 py-10 text-center sm:px-10 sm:py-12")}>
      <m.span
        key={shake}
        className="grid size-[88px] place-items-center rounded-3xl border-2 border-ink bg-slate-100 text-slate-600 shadow-[5px_5px_0_#0F172A] dark:border-slate-400 dark:bg-slate-800 dark:text-slate-300 dark:shadow-[5px_5px_0_rgba(148,163,184,0.45)]"
        initial={{ rotate: -4 }}
        animate={shake ? { rotate: [-4, -16, 10, -10, 2, -4] } : { rotate: -4 }}
        transition={{ duration: 0.5 }}
        aria-hidden="true"
      >
        <Icon className="size-10" />
      </m.span>
      <div className="flex flex-col items-center gap-2">
        <h2 id="gate-title" className="text-balance text-2xl font-bold text-ink sm:text-[26px] dark:text-slate-50">
          {kind === "locked" ? t("lockedTitle", { title: test.title }) : t("scheduledTitle", { title: test.title })}
        </h2>
        <p className="max-w-[480px] text-[15px] leading-[1.9] text-slate-600 dark:text-slate-300">
          {kind === "locked" ? (test.prerequisites.length ? t("lockedBody") : t("sidebar.lockedHint")) : t("scheduledBody")}
        </p>
        {kind === "scheduled" && opensIn != null && opensIn > 0 && (
          <p role="timer" aria-live="off" className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {opensIn >= 86_400 ? t("opensInDays", { count: Math.floor(opensIn / 86_400) }) : t("opensIn", { time: formatClock(opensIn) })}
          </p>
        )}
      </div>

      <m.ul
        className="flex w-full max-w-[520px] flex-col gap-2.5 text-start"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        {test.prerequisites.map((item) => (
          <m.li
            key={`${item.kind}-${item.id}`}
            variants={rise}
            className={cn(
              "flex items-center gap-3.5 rounded-2xl px-4 py-3",
              item.met
                ? "border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-500/10"
                : "border-[1.5px] border-dashed border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-900",
            )}
          >
            {item.met ? (
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-green-500 text-white" aria-hidden="true">
                <Check className="size-4 stroke-[3]" />
              </span>
            ) : (
              <span className="size-7 shrink-0 rounded-full border-2 border-slate-300 dark:border-slate-600" aria-hidden="true" />
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-semibold text-ink dark:text-slate-100">{item.title}</span>
              <span className={cn("text-xs", item.met ? "text-green-700 dark:text-green-300" : "text-muted dark:text-slate-400")}>
                {item.met ? t("prereqMet") : item.hint ?? t("prereqUnmet")}
              </span>
            </div>
            {!item.met && (
              <Link
                href={courseItemHref(test.course_id, item)}
                aria-label={t("goToItLabel", { title: item.title })}
                className={cn("inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-1 text-[13px] font-semibold text-brand-700 hover:text-brand-900 dark:text-brand-300", focusRing)}
              >
                {t("goToIt")}
                <ArrowLeft className="size-3.5 ltr:-scale-x-100" aria-hidden="true" />
              </Link>
            )}
          </m.li>
        ))}
        {(test.opens_at || test.closes_at) && (
          <m.li variants={rise}>
            <AvailabilityRow opensAt={test.opens_at} closesAt={test.closes_at} />
          </m.li>
        )}
      </m.ul>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {firstUnmet && (
          <m.div whileHover={{ y: -2 }} whileTap={{ y: 1 }}>
            <Link
              href={courseItemHref(test.course_id, firstUnmet)}
              className={cn(
                "inline-flex min-h-12 items-center gap-2.5 rounded-full border-2 border-ink bg-brand-700 px-6 text-[15px] font-bold text-white shadow-[3px_3px_0_#0F172A] transition-colors hover:bg-brand-900 dark:border-brand-300 dark:shadow-[3px_3px_0_#7dd3fc]",
                focusRing,
              )}
            >
              {t("goToItem", { title: firstUnmet.title })}
              <ArrowLeft className="size-[18px] ltr:-scale-x-100" aria-hidden="true" />
            </Link>
          </m.div>
        )}
        <button
          type="button"
          aria-disabled="true"
          aria-describedby="gate-title"
          onClick={() => setShake((count) => count + 1)}
          className={cn(
            "inline-flex min-h-12 cursor-not-allowed items-center gap-2 rounded-full border-2 border-dashed border-slate-300 bg-slate-100 px-5 text-[15px] font-semibold text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500",
            focusRing,
          )}
        >
          <LockKeyhole className="size-4" aria-hidden="true" />
          {t("start")}
        </button>
      </div>
    </section>
  );
}

