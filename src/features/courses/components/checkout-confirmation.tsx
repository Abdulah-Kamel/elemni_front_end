"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle, ShieldCheck, TicketPercent, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { resolveAssetUrl } from "@/src/lib/asset-url";
import type { CouponValidation } from "@/src/lib/coupons/coupons";
import type {
  PublicCourseDto,
  StudentCourseTeacherDto,
} from "@/src/lib/student-api/contract";

function formatPrice(value: string | number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export default function CheckoutConfirmation({
  open,
  course,
  teacher,
  loading,
  error,
  coupon,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  course: PublicCourseDto;
  teacher: StudentCourseTeacherDto | null;
  loading: boolean;
  error: string;
  coupon: CouponValidation | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("courseDetail");
  const locale = useLocale();
  const courseImageUrl = course.img ? resolveAssetUrl(course.img, "") : null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const loadingRef = useRef(loading);
  const onOpenChangeRef = useRef(onOpenChange);

  useEffect(() => {
    loadingRef.current = loading;
    onOpenChangeRef.current = onOpenChange;
  }, [loading, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loadingRef.current) onOpenChangeRef.current(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label={t("close")}
        className="absolute inset-0 cursor-default bg-[#07131F]/65 backdrop-blur-[2px]"
        onClick={() => {
          if (!loading) onOpenChange(false);
        }}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-dialog-title"
        className="sticker-tile relative max-h-[min(92vh,42rem)] w-full overflow-y-auto p-5 sm:max-w-lg sm:p-7"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label={t("close")}
          onClick={() => onOpenChange(false)}
          disabled={loading}
          className="absolute end-4 top-4 flex size-9 cursor-pointer items-center justify-center rounded-lg text-[#6B7E8F] transition hover:bg-[#EDF6FB] hover:text-[#0F2638] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] disabled:cursor-wait disabled:opacity-50"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="pe-10">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0284C7]">
            {t("securePayment")}
          </p>
          <h2 id="checkout-dialog-title" className="mt-2 text-2xl font-black tracking-[-0.025em] text-[#0F2638]">
            {t("checkoutTitle")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#536A7C]">{t("checkoutDescription")}</p>
        </div>

        <div className="mt-6 flex gap-4 rounded-xl border border-[#E4ECF2] bg-[#F8FBFD] p-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-[#DDF2FC]">
            {courseImageUrl ? (
              <Image src={courseImageUrl} alt="" fill sizes="80px" className="object-cover" />
            ) : (
              <ShieldCheck className="absolute inset-0 m-auto size-8 text-[#0284C7]" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-[#0F2638]">{course.title}</h3>
            {teacher && <p className="mt-1 truncate text-xs text-[#6B7E8F]">{teacher.name}</p>}
            {coupon?.ok ? (
              <div className="mt-2 rounded-xl border-2 border-dashed border-ink/20 bg-white px-3 py-2.5 text-sm font-bold text-ink tabular-nums dark:border-white/20 dark:bg-slate-900 dark:text-slate-50">
                <p className="flex justify-between text-muted dark:text-slate-400"><span>{t("couponOriginal")}</span><span className="line-through">{formatPrice(coupon.originalPrice, locale)}</span></p>
                <p className="mt-1 flex justify-between text-emerald-700 dark:text-emerald-300"><span className="inline-flex items-center gap-1.5"><TicketPercent className="size-4" aria-hidden="true" />{t("couponDiscount", { code: coupon.coupon!.code })}</span><span>-{formatPrice(coupon.discount, locale)}</span></p>
                <p className="mt-1.5 flex items-baseline justify-between border-t-2 border-ink/10 pt-1.5 dark:border-white/10"><span className="font-black">{t("couponTotal")}</span><span className="sticker-numeral text-xl font-black tracking-tight">{formatPrice(coupon.finalPrice, locale)} <span className="text-xs">{t("currency")}</span></span></p>
              </div>
            ) : (
              <p className="sticker-numeral mt-2 text-xl font-black tracking-tight text-ink dark:text-slate-50">
                {formatPrice(course.price, locale)} <span className="text-xs">{t("currency")}</span>
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-3 rounded-xl bg-[#F0F8FC] p-4 text-sm text-[#365469]">
          <p className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#0284C7]" aria-hidden="true" />
            {t("checkoutAccess")}
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#0284C7]" aria-hidden="true" />
            {t("securePayment")}
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-[#FFF2F2] px-3 py-2.5 text-sm font-bold text-[#B42318]">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="sticker-btn-outline order-2 h-12 cursor-pointer px-4 text-sm font-black text-ink transition disabled:cursor-wait disabled:opacity-50 disabled:shadow-none sm:order-1 dark:text-slate-200"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="sticker-btn order-1 inline-flex h-12 cursor-pointer items-center justify-center gap-2 px-4 text-sm font-black disabled:cursor-wait disabled:opacity-60 disabled:shadow-none sm:order-2"
          >
            {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? t("redirecting") : coupon?.ok ? t("continueToPaymentWithTotal", { total: formatPrice(coupon.finalPrice, locale) }) : t("continueToPayment")}
          </button>
        </div>
      </section>
    </div>
  );
}
