"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    // Placeholder - backend will be added later
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus("success");
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          {t("name")}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder={t("namePlaceholder")}
          className="ms-1 block w-full rounded-lg border border-gray-300 ps-4 pe-4 pt-3 pb-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          {t("email")}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder={t("emailPlaceholder")}
          className="ms-1 block w-full rounded-lg border border-gray-300 ps-4 pe-4 pt-3 pb-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700"
        >
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder={t("messagePlaceholder")}
          className="ms-1 block w-full rounded-lg border border-gray-300 ps-4 pe-4 pt-3 pb-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary ps-6 pe-6 pt-3 pb-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        {isSubmitting ? t("sending") : t("submit")}
      </button>

      {status === "success" && (
        <p className="text-sm text-green-600">{t("success")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">{t("error")}</p>
      )}
    </form>
  );
}
