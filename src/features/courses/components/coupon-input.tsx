// src/features/courses/components/coupon-input.tsx
"use client";
import { useState } from "react";
import { TicketPercent, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CouponValidation } from "@/src/lib/coupons/coupons";

export default function CouponInput({ price: _price, applied, error, onApply, onRemove, disabled }: {
  price: number | string; applied: CouponValidation | null; error?: string;
  onApply: (code: string) => void; onRemove: () => void; disabled?: boolean;
}) {
  void _price;
  const t = useTranslations("courseDetail");
  const [code, setCode] = useState("");
  if (applied?.ok && applied.coupon) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        <span className="inline-flex items-center gap-1.5"><TicketPercent className="size-4" aria-hidden="true" />{applied.coupon.code}</span>
        <button type="button" aria-label={t("couponRemove")} onClick={() => { setCode(""); onRemove(); }} disabled={disabled} className="cursor-pointer rounded-lg px-2 py-1 text-xs font-black hover:underline disabled:opacity-50"><X className="size-4" aria-hidden="true" /></button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex gap-2">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("couponPlaceholder")} disabled={disabled} aria-label={t("couponLabel")} className="h-11 min-w-0 flex-1 rounded-xl border-2 border-ink/10 bg-white px-3 text-sm font-bold uppercase placeholder:normal-case dark:border-white/10 dark:bg-slate-900" />
        <button type="button" onClick={() => onApply(code)} disabled={disabled || !code.trim()} className="sticker-btn-outline h-11 shrink-0 cursor-pointer px-4 text-sm font-black disabled:opacity-50">{t("couponApply")}</button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-bold text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
