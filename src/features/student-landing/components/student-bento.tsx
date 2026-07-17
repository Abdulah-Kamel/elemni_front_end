import { getTranslations } from "next-intl/server";
import { Wallet, MonitorPlay, FileCheck, LayoutGrid, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

const BENTO_CARDS: {
  key: string;
  span: string;
  bg: string;
  icon: LucideIcon;
  tileBg: string;
  hasDoc?: true;
}[] = [
  { key: "card1", span: "md:col-span-1", bg: "bg-white", icon: Wallet, tileBg: "bg-brand-600" },
  { key: "card2", span: "md:col-span-2", bg: "bg-white", icon: MonitorPlay, tileBg: "bg-brand-600" },
  { key: "card3", span: "md:col-span-2", bg: "bg-brand-100/50", icon: FileCheck, tileBg: "bg-accent-500", hasDoc: true },
  { key: "card4", span: "md:col-span-1", bg: "bg-white", icon: LayoutGrid, tileBg: "bg-brand-600" },
];

export async function StudentBentoGrid() {
  const t = await getTranslations("studentLanding.bento");

  return (
    <Section id="why" className="bg-brand-50">
      <Reveal>
        <h2 className="text-gradient mb-3 text-center text-3xl font-black md:text-4xl">
          {t("heading")}
        </h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-muted">
          {t("subtitle")}
        </p>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-3 auto-rows-[minmax(150px,auto)]">
        {BENTO_CARDS.map(({ key, span, bg, icon: Icon, tileBg, hasDoc }, i) => (
          <Reveal key={key} delay={i * 70} className={span}>
            <div className={`flex h-full flex-col rounded-2xl border border-brand-200/70 p-6 ${bg}`}>
              {hasDoc ? (
                <div className="flex items-center gap-5">
                  <div className="relative w-24 shrink-0">
                    <div className="h-28 w-24 rounded-lg border border-brand-200 bg-white p-3">
                      <div className="space-y-2">
                        <div className="h-1.5 w-full rounded bg-brand-100" />
                        <div className="h-1.5 w-3/4 rounded bg-brand-100" />
                        <div className="h-1.5 w-5/6 rounded bg-brand-100" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1.5 -end-1.5 grid size-5 place-items-center rounded-full bg-accent-500">
                      <Check className="size-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={`mb-3 ms-auto grid size-10 place-items-center rounded-full ${tileBg} text-white`}>
                      <Icon className="size-[18px]" />
                    </div>
                    <h3 className="text-start text-lg font-bold text-ink">
                      {t(`${key}.title`)}
                    </h3>
                    <p className="text-start text-sm leading-relaxed text-muted">
                      {t(`${key}.body`)}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`mb-3 ms-auto grid size-10 place-items-center rounded-full ${tileBg} text-white`}>
                    <Icon className="size-[18px]" />
                  </div>
                  <h3 className="text-start text-lg font-bold text-ink">
                    {t(`${key}.title`)}
                  </h3>
                  <p className="text-start text-sm leading-relaxed text-muted">
                    {t(`${key}.body`)}
                  </p>
                </>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
