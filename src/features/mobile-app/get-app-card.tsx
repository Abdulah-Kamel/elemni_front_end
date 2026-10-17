"use client";

import { Download, Smartphone, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import "@/src/features/portal/styles/sticker.css";

export const GET_APP_DISMISSED_KEY = "elemni-get-app-dismissed-v1";

/** Dashboard card inviting students to install the Android app. Hidden once dismissed in this browser. */
export default function GetAppCard({ downloadUrl, className = "" }: { downloadUrl: string | null; className?: string }) {
  const t = useTranslations("mobileAppPromo");
  // null until mounted: localStorage is browser-only, so nothing renders on the server.
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    let value = false;
    try {
      value = localStorage.getItem(GET_APP_DISMISSED_KEY) === "1";
    } catch {
      /* storage blocked: show the card */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser-only storage after mount
    setDismissed(value);
  }, []);

  if (!downloadUrl || dismissed !== false) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(GET_APP_DISMISSED_KEY, "1");
    } catch {
      /* storage blocked: hide for this visit only */
    }
    setDismissed(true);
  };

  return (
    <section
      aria-labelledby="get-app-heading"
      className={`sticker-tile relative border-2 border-ink bg-white p-5 dark:border-line dark:bg-slate-900 ${className}`}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="absolute end-2 top-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
      <div className="flex items-start gap-4 pe-10">
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink bg-brand-100 text-brand-700 dark:border-line dark:bg-slate-800 dark:text-brand-300">
          <Smartphone className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 id="get-app-heading" className="text-lg font-extrabold text-slate-900 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t("body")}</p>
        </div>
      </div>
      <a
        href={downloadUrl}
        download
        className="sticker-btn mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 px-5 text-sm font-extrabold"
      >
        <Download className="size-4" aria-hidden="true" />
        {t("download")}
      </a>
    </section>
  );
}
