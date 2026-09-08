"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { CheckCircle2, CircleAlert, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { resolveAssetUrl } from "@/src/lib/asset-url";
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
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  course: PublicCourseDto;
  teacher: StudentCourseTeacherDto | null;
  loading: boolean;
  error: string;
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
        className="relative max-h-[min(92vh,42rem)] w-full overflow-y-auto rounded-t-[1.5rem] border border-[#D8E3EC] bg-white p-5 shadow-[0_30px_90px_-32px_rgba(2,35,58,0.8)] sm:max-w-lg sm:rounded-2xl sm:p-7"
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
            <p className="mt-2 text-lg font-black text-[#075985]">
              {formatPrice(course.price, locale)} <span className="text-xs">{t("currency")}</span>
            </p>
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
            className="order-2 h-11 cursor-pointer rounded-xl border border-[#C9D8E3] px-4 text-sm font-black text-[#365469] transition hover:bg-[#F6FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0284C7] sm:order-1"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="order-1 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0284C7] px-4 text-sm font-black text-white transition hover:bg-[#0369A1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7DD3FC] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:order-2"
          >
            {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            {loading ? t("redirecting") : t("continueToPayment")}
          </button>
        </div>
      </section>
    </div>
  );
}
