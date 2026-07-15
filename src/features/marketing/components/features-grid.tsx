import { getTranslations } from "next-intl/server";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import {
  ClipboardCheck,
  Folder,
  ShieldCheck,
  Smartphone,
  Banknote,
  LineChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const FEATURE_ITEMS: {
  key: string;
  icon: LucideIcon;
  chipClass: string;
}[] = [
  {
    key: "exams",
    icon: ClipboardCheck,
    chipClass: "bg-success-500/15 text-success-700",
  },
  {
    key: "organize",
    icon: Folder,
    chipClass: "bg-accent-400/10 text-accent-600",
  },
  {
    key: "drm",
    icon: ShieldCheck,
    chipClass: "bg-pink-100 text-pink-600",
  },
  {
    key: "mobile",
    icon: Smartphone,
    chipClass: "bg-blue-100 text-blue-600",
  },
  {
    key: "payments",
    icon: Banknote,
    chipClass: "bg-orange-100 text-orange-600",
  },
  {
    key: "reports",
    icon: LineChart,
    chipClass: "bg-brand-100 text-brand-700",
  },
];

export async function FeaturesGrid() {
  const t = await getTranslations("features");

  return (
    <Section id="features" className="bg-brand-50">
      <Reveal>
        <h2 className="mb-12 text-center text-3xl font-black text-brand-700 md:text-4xl">
          {t("heading")}
        </h2>
      </Reveal>
      <div className="grid gap-6 md:grid-cols-3">
        {FEATURE_ITEMS.map(({ key, icon: Icon, chipClass }, i) => (
          <Reveal key={key} delay={i * 60} className="h-full">
            <div className="h-full rounded-3xl bg-white p-6 shadow-soft motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:-translate-y-1.5 motion-safe:hover:shadow-lift">
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
