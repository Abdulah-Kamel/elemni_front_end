"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setStatus("success");
    setIsSubmitting(false);
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="contact-name"
          className="block text-sm font-bold text-slate-800 dark:text-slate-100"
        >
          {t("name")}
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          required
          placeholder={t("namePlaceholder")}
          className="mt-2 block min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600"
        />
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="block text-sm font-bold text-slate-800 dark:text-slate-100"
        >
          {t("email")}
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          required
          placeholder={t("emailPlaceholder")}
          className="mt-2 block min-h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600"
        />
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-sm font-bold text-slate-800 dark:text-slate-100"
        >
          {t("message")}
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          placeholder={t("messagePlaceholder")}
          className="mt-2 block w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500 dark:hover:border-slate-600"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:focus-visible:ring-offset-slate-900"
      >
        <Send className="size-4" aria-hidden="true" />
        {isSubmitting ? t("sending") : t("submit")}
      </button>

      <p aria-live="polite" className="min-h-5 text-sm">
        {status === "success" ? (
          <span className="text-primary">{t("success")}</span>
        ) : null}
        {status === "error" ? (
          <span className="text-red-600 dark:text-red-400">{t("error")}</span>
        ) : null}
      </p>
    </form>
  );
}
