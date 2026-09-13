// src/features/courses/components/coupon-input.tsx
"use client";
import { useState } from "react";
import { CircleAlert, TicketPercent, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CouponValidation } from "@/src/lib/coupons/coupons";

export default function CouponInput({ applied, error, onApply, onRemove, disabled }: {
  applied: CouponValidation | null; error?: string;
  onApply: (code: string) => void; onRemove: () => void; disabled?: boolean;
}) {
  const t = useTranslations("courseDetail");
  const [code, setCode] = useState("");
  if (applied?.ok && applied.coupon) {
    return (
      <div className="sticker-badge inline-flex w-full -rotate-1 items-center justify-between gap-2 bg-emerald-100 px-3 py-2.5 text-sm font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <TicketPercent className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate font-mono tracking-wide">{applied.coupon.code}</span>
        </span>
        <button type="button" aria-label={t("couponRemove")} onClick={() => { setCode(""); onRemove(); }} disabled={disabled} className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition hover:bg-emerald-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:opacity-50 dark:hover:bg-emerald-500/20">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && code.trim() && !disabled) onApply(code.trim()); }}
          placeholder={t("couponPlaceholder")}
          disabled={disabled}
          aria-label={t("couponLabel")}
          autoComplete="off"
          spellCheck={false}
          className="h-11 min-w-0 flex-1 rounded-xl border-2 border-dashed border-ink/25 bg-white px-3 font-mono text-sm font-bold uppercase tracking-widest text-ink placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-solid focus:border-brand-600 focus:outline-none disabled:opacity-50 dark:border-white/20 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500"
        />
        <button type="button" onClick={() => onApply(code.trim())} disabled={disabled || !code.trim()} className="sticker-btn-outline h-11 shrink-0 cursor-pointer px-4 text-sm font-black disabled:opacity-50 disabled:shadow-none">{t("couponApply")}</button>
      </div>
      {error && (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs font-bold text-red-600 dark:text-red-400">
          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
