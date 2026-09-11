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

const STATUS_STYLE: Record<
  PaymentResultStatus,
  { icon: typeof CheckCircle2; ring: string; chip: string }
> = {
  completed: {
    icon: CheckCircle2,
    ring: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
  },
  failed: {
    icon: XCircle,
    ring: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
    chip: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
  },
  pending: {
    icon: Clock3,
    ring: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    chip: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
  },
  cancelled: {
    icon: Ban,
    ring: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
    chip: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
  },
  refunded: {
    icon: RotateCcw,
    ring: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
    chip: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30",
  },
  unknown: {
    icon: CircleAlert,
    ring: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
    chip: "bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/30",
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
    <m.div
      className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section
        aria-labelledby="payment-result-title"
        className="rounded-2xl border border-[#E2E0EF] bg-white p-6 text-center shadow-[0_8px_24px_rgba(2,132,199,0.06)] sm:p-8 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
      >
        <span
          className={cn(
            "mx-auto flex size-14 items-center justify-center rounded-full ring-1",
            style.ring,
          )}
        >
          <Icon className="size-7" aria-hidden="true" />
        </span>

        <p className="mt-5 text-xs font-bold tracking-wide text-[#777587] dark:text-slate-400">
          {t("eyebrow")}
        </p>
        <h1
          id="payment-result-title"
          className="mt-2 text-2xl font-black text-[#1B1B24] sm:text-3xl dark:text-slate-100"
        >
          {t(`title.${result.status}`)}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#464555] dark:text-slate-300">
          {t(`description.${result.status}`)}
        </p>

        {result.isTestMode && (
          <p className="mx-auto mt-4 w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30">
            {t("testModeBadge")}
            <span className="sr-only">. </span>
            <span className="font-medium">{t("testModeNote")}</span>
          </p>
        )}

        {details.length > 0 && (
          <div className="mt-6 border-t border-[#E2E0EF] pt-6 text-start dark:border-slate-800">
            <h2 className="text-sm font-black text-[#1B1B24] dark:text-slate-100">
              {t("detailsTitle")}
            </h2>
            <dl className="mt-3 space-y-2.5">
              {details.map(({ id, label, value }) => (
                <div
                  key={id}
                  className="flex items-center justify-between gap-4 rounded-lg bg-[#F8FBFD] px-3 py-2.5 text-sm dark:bg-slate-800/60"
                >
                  <dt className="shrink-0 text-xs font-bold text-[#777587] dark:text-slate-400">
                    {label}
                  </dt>
                  <dd className="min-w-0 truncate font-bold text-[#1B1B24] tabular-nums ltr:font-mono dark:text-slate-100">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="mt-7 flex flex-col gap-2.5">
          {showCourseLink && result.courseHref && (
            <Link
              href={result.courseHref}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0284C7] px-6 text-sm font-black text-white transition hover:bg-[#0369A1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] focus-visible:ring-offset-2"
            >
              {t("actions.openCourse")}
            </Link>
          )}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <Link
              href="/my-courses"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#BAE6FD] bg-white px-5 text-sm font-black text-[#0369A1] transition hover:bg-[#E0F2FE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800"
            >
              {t("actions.myCourses")}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#E2E0EF] bg-white px-5 text-sm font-bold text-[#464555] transition hover:bg-[#F8FBFD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {t("actions.dashboard")}
            </Link>
          </div>
          <Link
            href="/explore"
            className="mt-1 text-sm font-bold text-[#0369A1] hover:underline dark:text-sky-300"
          >
            {t("actions.explore")}
          </Link>
        </div>
      </section>
    </m.div>
  );
}
