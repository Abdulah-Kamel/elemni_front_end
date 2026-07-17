import { getTranslations, getLocale } from "next-intl/server";
import { cn } from "@/src/lib/cn";
import { Button } from "@/src/components/ui/button";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import { STUDENT_STEPS } from "@/src/features/marketing/data";

export async function StudentStepsSection() {
  const t = await getTranslations("studentLanding.steps");
  const locale = await getLocale();
  const numberFormat = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US");

  return (
    <Section id="how">
      <Reveal>
        <h2 className="text-gradient mb-3 text-center text-3xl font-bold tracking-tight md:text-4xl">
          {t("heading")}
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-muted">
          {t("subtitle")}
        </p>
      </Reveal>

      <div className="relative grid gap-8 md:grid-cols-3">
        <div
          aria-hidden
          className="absolute inset-x-[16%] top-6 hidden border-t-2 border-dashed border-accent-400/60 md:block"
        />

        {STUDENT_STEPS.map((step, i) => (
          <Reveal key={step.num} delay={i * 120}>
            <div className="relative flex flex-col items-center text-center">
              <div
                className={cn(
                  "flex size-12 items-center justify-center rounded-full text-lg font-bold text-white",
                  step.circleClass,
                )}
              >
                {numberFormat.format(step.num)}
              </div>
              <h3 className="mt-4 text-xl font-bold text-ink">
                {t(`${step.num}.title`)}
              </h3>
              <p className="mt-2 text-muted">{t(`${step.num}.desc`)}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={360}>
        <div className="mt-10 text-center">
          <Button variant="primary">{t("cta")}</Button>
        </div>
      </Reveal>
    </Section>
  );
}
