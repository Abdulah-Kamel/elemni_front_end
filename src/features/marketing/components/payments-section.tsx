import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CircleCheck } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Badge } from "@/src/components/ui/button";
import { Reveal } from "@/src/components/ui/reveal";

export default async function PaymentsSection() {
  const t = await getTranslations("payments");

  return (
    <Section id="payments">
      <Reveal>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-900 md:text-4xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-lg text-brand-600">{t("subtitle")}</p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Reveal className="rounded-3xl border border-brand-100 p-6">
          <h3 className="text-xl font-bold text-brand-900">{t("methodsTitle")}</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
              <span className="size-2 rounded-full bg-green-500" />
              {t("methods.instapay")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
              <span className="size-2 rounded-full bg-blue-500" />
              {t("methods.fawry")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
              <span className="size-2 rounded-full bg-red-500" />
              {t("methods.vodafone")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
              <span className="size-2 rounded-full bg-purple-500" />
              {t("methods.meeza")}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700">
              <span className="size-2 rounded-full bg-amber-500" />
              {t("methods.card")}
            </span>
          </div>
        </Reveal>

        {/* Illustrative figures — static copy, never computed. See CLAUDE.md "Money". */}
        <Reveal delay={80} className="rounded-3xl border border-brand-100 p-6">
          <h3 className="text-xl font-bold text-brand-900">{t("calcTitle")}</h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-sm text-brand-600">
              <span>{t("calcCourseLabel")}</span>
              <span className="font-semibold text-brand-900">{t("calcCourseValue")}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-brand-600">
              <span>{t("calcStudentsLabel")}</span>
              <span className="font-semibold text-brand-900">{t("calcStudentsValue")}</span>
            </div>
            <div className="rounded-2xl bg-accent-500/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-accent-600">{t("calcResultLabel")}</span>
                <span className="text-2xl font-bold text-accent-600">{t("calcResultValue")}</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <Reveal delay={160}>
        <div className="mt-10">
          <h3 className="text-center text-xl font-bold text-brand-900">
            {t("cardsTitle")}
          </h3>
          <div className="mx-auto mt-4 flex max-w-2xl flex-col items-center gap-6 rounded-3xl border-2 border-accent-400 bg-accent-400/5 p-6 sm:flex-row">
            <Image
              src="/placeholders/payment-card.svg"
              alt=""
              width={320}
              height={200}
              className="w-40 shrink-0 rounded-xl shadow-soft motion-safe:animate-float"
            />
            <div>
              <Badge tone="amber">{t("cardsBadge")}</Badge>
              <p className="mt-3 text-sm text-brand-600">{t("cardsDesc")}</p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={240}>
        <div className="mt-10 flex items-center justify-center gap-2 rounded-full bg-success-500/15 px-6 py-3 text-sm font-medium text-success-700">
          <CircleCheck className="size-5" />
          {t("note")}
        </div>
      </Reveal>
    </Section>
  );
}
