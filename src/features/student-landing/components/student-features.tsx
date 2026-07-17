import { getTranslations } from "next-intl/server";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import { STUDENT_FEATURES } from "@/src/features/marketing/data";

export async function StudentFeaturesGrid() {
  const t = await getTranslations("studentLanding.features");

  return (
    <Section id="features" className="bg-brand-50">
      <Reveal>
        <h2 className="text-gradient mb-12 text-center text-3xl font-black md:text-4xl">
          {t("heading")}
        </h2>
      </Reveal>
      <div className="grid gap-6 md:grid-cols-3">
        {STUDENT_FEATURES.map(({ key, icon: Icon, chipClass }, i) => (
          <Reveal key={key} delay={i * 60} className="h-full">
            <div className="h-full rounded-2xl border border-brand-200/70 bg-white p-6 transition-colors hover:border-brand-200">
              <div className={`mb-4 inline-flex rounded-2xl p-3 ${chipClass}`}>
                <Icon size={24} />
              </div>
              <h3 className="mb-1 text-lg font-bold">{t(`${key}.title`)}</h3>
              <p className="text-sm text-muted">{t(`${key}.desc`)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
