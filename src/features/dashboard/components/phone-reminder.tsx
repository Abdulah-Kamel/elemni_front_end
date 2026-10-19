"use client";

import { useId, useState, useSyncExternalStore, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Smartphone, X } from "lucide-react";
import { m } from "motion/react";
import { useTranslations } from "next-intl";
import { PHONE_PATTERN, saveStudentProfile } from "@/src/features/onboarding/client";
import { studentQueryKeys } from "@/src/features/student/query-keys";

const DISMISSED_KEY = "elemni-phone-reminder-dismissed";
const popSpring = { type: "spring", stiffness: 260, damping: 22 } as const;

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function isDismissed() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

// Hidden during server rendering so a dismissed reminder never flashes in.
const serverDismissed = () => true;

/** Asks a student without a phone number for one; hiding it lasts for this browser session. */
export function PhoneReminder({ className }: { className?: string }) {
  const t = useTranslations("studentDashboard.phoneReminder");
  const queryClient = useQueryClient();
  const id = useId();
  const storedDismissal = useSyncExternalStore(subscribeToStorage, isDismissed, serverDismissed);
  const [dismissed, setDismissed] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<"invalid" | "error" | null>(null);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* Keep dismissal working when browser storage is disabled. */
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (!PHONE_PATTERN.test(phone)) {
      setError("invalid");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const profile = await saveStudentProfile({ phone_number: phone });
      queryClient.setQueryData(studentQueryKeys.profile(), profile);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: studentQueryKeys.profile() }),
        queryClient.invalidateQueries({ queryKey: studentQueryKeys.me() }),
      ]);
    } catch {
      setError("error");
    } finally {
      setSaving(false);
    }
  }

  if (dismissed || storedDismissal) return null;

  return (
    <m.section
      aria-labelledby={`${id}-title`}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={popSpring}
      className={`sticker-tile border-2 border-ink bg-amber-50 p-5 dark:border-line dark:bg-slate-900 ${className ?? ""}`}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="sticker-badge grid size-11 shrink-0 -rotate-3 place-items-center bg-amber-300 text-ink"><Smartphone className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="text-lg font-extrabold text-slate-900 dark:text-white">{t("title")}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{t("body")}</p>
        </div>
        <button type="button" onClick={dismiss} aria-label={t("dismiss")} className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-slate-600 transition hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 dark:text-slate-300 dark:hover:bg-slate-800">
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <form noValidate onSubmit={save} aria-busy={saving} className="mt-4 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 basis-56">
          <label htmlFor={`${id}-phone`} className="mb-2 block text-sm font-bold text-slate-900 dark:text-white">{t("label")}</label>
          <input
            id={`${id}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            value={phone}
            disabled={saving}
            onChange={(event) => { setPhone(event.target.value); setError(null); }}
            placeholder={t("placeholder")}
            aria-invalid={error === "invalid"}
            aria-describedby={error ? `${id}-error` : undefined}
            className="h-12 w-full rounded-xl border-2 border-ink/30 bg-white px-4 text-start font-bold text-slate-900 tabular-nums focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <button type="submit" disabled={saving} className="sticker-btn inline-flex h-12 cursor-pointer items-center gap-2 px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
          {saving ? t("saving") : t("save")}
        </button>
        {error && <p id={`${id}-error`} role="alert" className="w-full text-sm font-semibold text-red-700 dark:text-red-300">{t(error)}</p>}
      </form>
    </m.section>
  );
}
