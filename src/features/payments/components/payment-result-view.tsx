"use client";

import {
  Ban,
  CheckCircle2,
  CircleAlert,
  Clock3,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { cn } from "@/src/lib/cn";
import type {
  PaymentResultDetails,
  PaymentResultStatus,
} from "../parse-payment-result";

const popSpring = { type: "spring", stiffness: 260, damping: 20 } as const;

const STATUS_STYLE: Record<
  PaymentResultStatus,
  { icon: typeof CheckCircle2; ring: string }
> = {
  completed: {
    icon: CheckCircle2,
    ring: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  failed: {
    icon: XCircle,
    ring: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  },
  pending: {
    icon: Clock3,
    ring: "bg-amber-200 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  },
  cancelled: {
    icon: Ban,
    ring: "bg-slate-200 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
  },
  refunded: {
    icon: RotateCcw,
    ring: "bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300",
  },
  unknown: {
    icon: CircleAlert,
    ring: "bg-slate-200 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
  },
};

export default function PaymentResultView({
  result,
}: {
  result: PaymentResultDetails;
}) {
  const t = useTranslations("paymentResult");
  const style = STATUS_STYLE[result.status] ?? STATUS_STYLE.unknown;
  const Icon = style.icon;

  const amountValue =
    result.amount || result.currency
      ? [result.amount, result.currency].filter(Boolean).join(" ")
      : null;
  const cardValue =
    result.cardBrand || result.maskedCard
      ? [result.cardBrand, result.maskedCard].filter(Boolean).join(" ")
      : null;

  const details: Array<{ id: string; label: string; value: string }> = [];
  if (result.orderId) details.push({ id: "order", label: t("orderLabel"), value: result.orderId });
  if (result.transactionId)
    details.push({ id: "transaction", label: t("transactionLabel"), value: result.transactionId });
  if (amountValue) details.push({ id: "amount", label: t("amountLabel"), value: amountValue });
  if (cardValue) details.push({ id: "card", label: t("cardLabel"), value: cardValue });
  if (result.orderReference)
    details.push({ id: "reference", label: t("referenceLabel"), value: result.orderReference });

  const showCourseLink = result.status === "completed" && result.courseHref !== null;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <m.section
        aria-labelledby="payment-result-title"
        className="sticker-tile p-6 text-center sm:p-8"
        initial={{ opacity: 0, y: 32, rotate: -0.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={popSpring}
      >
        <m.span
          className={cn(
            "sticker-badge mx-auto flex size-16 items-center justify-center",
            style.ring,
          )}
          initial={{ scale: 0, rotate: -24 }}
          animate={{ scale: 1, rotate: -4 }}
          transition={{ ...popSpring, delay: 0.15 }}
        >
          <Icon className="size-8" aria-hidden="true" />
        </m.span>

        <m.h1
          id="payment-result-title"
          className="mt-5 text-3xl font-black tracking-tight text-ink sm:text-4xl dark:text-slate-50"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...popSpring, delay: 0.2 }}
        >
          {t(`title.${result.status}`)}
        </m.h1>
        <m.p
          className="mx-auto mt-3 max-w-md text-sm leading-7 font-medium text-muted dark:text-slate-400"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...popSpring, delay: 0.25 }}
        >
          {t(`description.${result.status}`)}
        </m.p>

        {result.isTestMode && (
          <p className="sticker-badge mx-auto mt-4 w-fit rotate-1 bg-amber-300 px-3 py-1 text-xs font-black text-ink">
            {t("testModeBadge")}
            <span aria-hidden="true"> · </span>
            <span className="font-bold">{t("testModeNote")}</span>
          </p>
        )}

        {details.length > 0 && (
          <m.div
            className="mt-6 border-t-2 border-ink/10 pt-6 text-start dark:border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-sm font-black text-ink dark:text-slate-100">
              {t("detailsTitle")}
            </h2>
            <dl className="mt-3 space-y-2.5">
              {details.map(({ id, label, value }, index) => (
                <m.div
                  key={id}
                  className="flex items-center justify-between gap-4 rounded-xl border-2 border-ink/10 bg-brand-50/60 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-slate-800/60"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...popSpring, delay: 0.3 + 0.05 * index }}
                >
                  <dt className="shrink-0 text-xs font-black text-muted dark:text-slate-400">
                    {label}
                  </dt>
                  <dd className="sticker-numeral min-w-0 truncate font-black text-ink ltr:font-mono dark:text-slate-100">
                    {value}
                  </dd>
                </m.div>
              ))}
            </dl>
          </m.div>
        )}

        <m.div
          className="mt-7 flex flex-col gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...popSpring, delay: 0.35 }}
        >
          {showCourseLink && result.courseHref && (
            <m.div whileHover={{ scale: 1.03, rotate: -0.5 }} whileTap={{ scale: 0.97 }} transition={popSpring}>
              <Link
                href={result.courseHref}
                className="sticker-btn inline-flex h-13 w-full items-center justify-center px-6 py-3.5 text-base font-black"
              >
                {t("actions.openCourse")}
              </Link>
            </m.div>
          )}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Link
              href="/my-courses"
              className="sticker-btn-outline inline-flex h-12 items-center justify-center px-5 text-sm font-black text-brand-700 dark:text-brand-300"
            >
              {t("actions.myCourses")}
            </Link>
            <Link
              href="/dashboard"
              className="sticker-btn-outline inline-flex h-12 items-center justify-center px-5 text-sm font-black text-ink dark:text-slate-200"
            >
              {t("actions.dashboard")}
            </Link>
          </div>
          <Link
            href="/explore"
            className="mt-1 text-sm font-black text-brand-700 hover:underline dark:text-brand-300"
          >
            {t("actions.explore")}
          </Link>
        </m.div>
      </m.section>
    </div>
  );
}
