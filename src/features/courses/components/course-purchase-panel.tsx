"use client";

import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type {
  EnrollmentDto,
  PublicCourseDto,
} from "@/src/lib/student-api/contract";

function formatPrice(value: string | number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatExpiry(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    dateStyle: "long",
  }).format(new Date(value));
}

export default function CoursePurchasePanel({
  course,
  enrollment,
  isAuthenticated,
  loading,
  onPurchase,
  onContinue,
}: {
  course: PublicCourseDto;
  enrollment: EnrollmentDto | null;
  isAuthenticated: boolean;
  loading: boolean;
  onPurchase: () => void;
  onContinue: () => void;
}) {
  const t = useTranslations("courseDetail");
  const locale = useLocale();
  const enrolled = Boolean(enrollment);

  return (
    <section className="rounded-2xl border border-[#D8E3EC] bg-white p-5 shadow-[0_18px_44px_-32px_rgba(15,23,42,0.7)] sm:p-6 lg:sticky lg:top-24">
      <div className="flex items-end justify-between gap-3 border-b border-[#E4ECF2] pb-5">
        <div>
          <p className="text-xs font-bold text-[#6B7E8F]">{t("checkoutPrice")}</p>
          <p className="mt-1 text-3xl font-black tracking-[-0.03em] text-[#0F2638]">
            {formatPrice(enrollment?.course_price ?? course.price, locale)}
            <span className="ms-1 text-sm font-bold text-[#6B7E8F]">ج.م</span>
          </p>
        </div>
        {enrolled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF8EC] px-3 py-1.5 text-xs font-black text-[#087443]">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {t("continueLearning")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F6FE] px-3 py-1.5 text-xs font-black text-[#075985]">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {t("securePayment")}
          </span>
        )}
      </div>

      <div className="space-y-3 py-5 text-sm text-[#536A7C]">
        <p className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#0284C7]" aria-hidden="true" />
          {enrollment
            ? t("enrollmentUntil", { date: formatExpiry(enrollment.expires_at, locale) })
            : t("accessDuration")}
        </p>
        <p className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#0284C7]" aria-hidden="true" />
          {t("publishedContent")}
        </p>
      </div>

      <button
        type="button"
        onClick={enrolled ? onContinue : onPurchase}
        disabled={loading}
        className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-[#0284C7] px-5 text-sm font-black text-white shadow-[0_12px_24px_-16px_rgba(2,132,199,0.95)] transition hover:bg-[#0369A1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7DD3FC] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {enrolled ? t("continueLearning") : t("subscribe")}
      </button>

      {!enrolled && !isAuthenticated && (
        <p className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-center text-xs font-bold text-[#6B7E8F]">
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          {t("signInToContinue")}
        </p>
      )}
    </section>
  );
}
