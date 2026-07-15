import { getTranslations, getLocale } from "next-intl/server";
import { Rocket, Upload, Sparkles } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Button } from "@/src/components/ui/button";
import { Reveal } from "@/src/components/ui/reveal";

const CARDS = [
  { icon: Upload, key: "1" },
  { icon: Sparkles, key: "2" },
  { icon: Rocket, key: "3" },
] as const;

const TITLE_KEY = { "1": "1.title", "2": "2.title", "3": "3.title" } as const;

export async function MigrationSection() {
  const t = await getTranslations("migration");
  const locale = await getLocale();
  const numberFormat = new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US");

  return (
    <Section className="bg-brand-50">
      <Reveal>
        <h2 className="mb-12 text-center text-3xl font-bold text-brand-900 md:text-4xl">
          {t("heading")}
        </h2>
      </Reveal>

      <div className="grid gap-6 md:grid-cols-3">
        {CARDS.map(({ icon: Icon, key }, i) => (
          <Reveal key={key} delay={i * 80} className="h-full">
            <div className="flex h-full flex-col items-start gap-4 rounded-2xl bg-white p-6 shadow-soft motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:-translate-y-1.5 motion-safe:hover:shadow-lift">
              <span className="w-fit rounded-2xl bg-brand-100 p-3 text-brand-700">
                <Icon className="size-6" />
              </span>
              <h3 className="text-lg font-bold text-brand-900">
                <span className="text-muted">{numberFormat.format(Number(key))}) </span>
                {t(TITLE_KEY[key])}
              </h3>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={240}>
        <div className="mt-12 text-center">
          <Button variant="outline">{t("cta")}</Button>
          <p className="mt-3 text-sm text-muted">{t("note")}</p>
        </div>
      </Reveal>
    </Section>
  );
}
