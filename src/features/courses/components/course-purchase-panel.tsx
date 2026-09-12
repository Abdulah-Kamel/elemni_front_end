"use client";

import { CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import CouponInput from "./coupon-input";
import type { CouponValidation } from "@/src/lib/coupons/coupons";
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
  couponApplied,
  couponError,
  onCouponApply,
  onCouponRemove,
}: {
  course: PublicCourseDto;
  enrollment: EnrollmentDto | null;
  isAuthenticated: boolean;
  loading: boolean;
  onPurchase: () => void;
  onContinue: () => void;
  couponApplied: CouponValidation | null;
  couponError: string;
  onCouponApply: (code: string) => void;
  onCouponRemove: () => void;
}) {
  const t = useTranslations("courseDetail");
  const locale = useLocale();
  const enrolled = Boolean(enrollment);

  return (
    <section className="sticker-tile p-5 sm:p-6 lg:sticky lg:top-24">
      <div className="flex items-end justify-between gap-3 border-b-2 border-ink/10 pb-5 dark:border-white/10">
        <div>
          <p className="text-xs font-black text-muted dark:text-slate-400">{t("checkoutPrice")}</p>
          <p className="sticker-numeral mt-1 text-4xl font-black tracking-tight text-ink dark:text-slate-50">
            {formatPrice(enrollment?.course_price ?? course.price, locale)}
            <span className="ms-1 text-sm font-black text-muted dark:text-slate-400">{t("currency")}</span>
          </p>
        </div>
        {enrolled ? (
          <span className="sticker-badge inline-flex rotate-1 items-center gap-1.5 bg-emerald-100 px-3 py-1.5 text-xs font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {t("continueLearning")}
          </span>
        ) : (
          <span className="sticker-badge inline-flex -rotate-1 items-center gap-1.5 bg-brand-100 px-3 py-1.5 text-xs font-black text-brand-700 dark:bg-slate-800 dark:text-brand-300">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {t("securePayment")}
          </span>
        )}
      </div>

      {!enrolled && (
        <div className="border-b-2 border-ink/10 py-4 dark:border-white/10">
          <CouponInput price={Number(enrollment?.course_price ?? course.price)} applied={couponApplied} error={couponError} onApply={onCouponApply} onRemove={onCouponRemove} disabled={loading} />
          {couponApplied?.ok && (
            <div className="mt-3 space-y-1 text-sm font-bold">
              <p className="flex justify-between text-muted"><span>{t("couponOriginal")}</span><span className="line-through">{formatPrice(couponApplied.originalPrice, locale)}</span></p>
              <p className="flex justify-between text-emerald-600"><span>{t("couponDiscount", { code: couponApplied.coupon!.code })}</span><span>-{formatPrice(couponApplied.discount, locale)}</span></p>
              <p className="flex justify-between text-base font-black text-ink dark:text-slate-50"><span>{t("couponTotal")}</span><span>{formatPrice(couponApplied.finalPrice, locale)}</span></p>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 py-5 text-sm font-medium text-muted dark:text-slate-400">
        <p className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />
          {enrollment
            ? t("enrollmentUntil", { date: formatExpiry(enrollment.expires_at, locale) })
            : t("accessDuration")}
        </p>
        <p className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />
          {t("publishedContent")}
        </p>
      </div>

      <button
        type="button"
        onClick={enrolled ? onContinue : onPurchase}
        disabled={loading}
        className="sticker-btn flex h-13 w-full cursor-pointer items-center justify-center px-5 py-3.5 text-sm font-black disabled:cursor-wait disabled:opacity-60 disabled:shadow-none"
      >
        {enrolled ? t("continueLearning") : t("subscribe")}
      </button>

      {!enrolled && !isAuthenticated && (
        <p className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-center text-xs font-bold text-muted dark:text-slate-400">
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          {t("signInToContinue")}
        </p>
      )}
    </section>
  );
}
