import { getTranslations } from "next-intl/server";
import { Globe, Sigma, FlaskConical, BookOpen, GraduationCap } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import { Counter } from "@/src/components/ui/counter";
import { STATS } from "@/src/features/marketing/data";

const SUBJECT_ICONS = [Globe, Sigma, FlaskConical, GraduationCap, BookOpen];

export async function StatsBar() {
  const t = await getTranslations("stats");

  return (
    <Section>
      <div className="grid grid-cols-1 text-center sm:grid-cols-3">
        {STATS.map((stat, i) => (
          <Reveal
            key={stat.key}
            delay={i * 80}
            className={i > 0 ? "border-s border-brand-100" : ""}
          >
            <p className="text-3xl font-black text-brand-700 md:text-4xl">
              <Counter value={stat.value} suffix={t(`${stat.key}.suffix`)} />
            </p>
            <p className="text-muted">{t(`${stat.key}.label`)}</p>
          </Reveal>
        ))}
      </div>

      <div
        aria-hidden
        className="mt-10 flex items-center justify-center gap-6 text-brand-300"
      >
        {SUBJECT_ICONS.map((Icon, i) => (
          <Icon key={i} className="size-5" />
        ))}
      </div>
    </Section>
  );
}
