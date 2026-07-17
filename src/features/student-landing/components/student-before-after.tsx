import { getLocale, getTranslations } from "next-intl/server";
import { CircleCheck, CircleX, ArrowLeft, Frown, Star } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { Button } from "@/src/components/ui/button";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

export async function StudentBeforeAfter() {
  const t = await getTranslations("studentLanding.beforeAfter");
  const locale = await getLocale();
  const isRtl = locale === "ar";

  const withItems = [1, 2, 3, 4] as const;
  const withoutItems = [1, 2, 3, 4] as const;

  return (
    <Section id="before-after">
      <Reveal>
        <h2 className="text-gradient mb-3 text-center text-3xl font-bold tracking-tight md:text-4xl">
          {t("heading")}
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-muted">
          {t("subtitle")}
        </p>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-2">
        <Reveal className="h-full">
          <div className="h-full rounded-2xl border border-brand-300 bg-brand-100/40 p-8">
            <span className="mb-4 grid size-10 place-items-center rounded-full bg-accent-500/15">
              <Star className="size-5 fill-accent-500 text-accent-500" />
            </span>
            <h3 className="mb-6 text-2xl font-bold text-ink">{t("withTitle")}</h3>
            <ul className="space-y-5">
              {withItems.map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <CircleCheck className="size-5 text-success-700 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-ink">{t(`with.${i}.title`)}</p>
                    <p className="text-sm text-muted">{t(`with.${i}.desc`)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button variant="primary" className="text-ink motion-safe:hover:-translate-y-0.5">
                {t("with.cta")}
                <ArrowLeft aria-hidden className={cn("size-4", isRtl ? "rotate-180" : "")} />
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80} className="h-full">
          <div className="h-full rounded-2xl bg-white p-8 ring-1 ring-brand-100">
            <span className="mb-4 grid size-10 place-items-center rounded-full bg-brand-50 text-muted">
              <Frown className="size-5" />
            </span>
            <h3 className="mb-6 text-2xl font-bold text-ink">{t("withoutTitle")}</h3>
            <ul className="space-y-5">
              {withoutItems.map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <CircleX className="size-5 text-danger-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-ink">{t(`without.${i}.title`)}</p>
                    <p className="text-sm text-muted">{t(`without.${i}.desc`)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
