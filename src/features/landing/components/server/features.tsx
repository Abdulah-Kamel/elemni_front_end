import { Target, CheckSquare, Rocket, Zap, ChevronLeft } from "lucide-react";
import { Reveal } from "@/src/components/ui/reveal";
import { getTranslations } from "next-intl/server";

export default async function Features() {
  const t = await getTranslations("landingFeatures");
  const steps = [
    {
      id: "step-1",
      stepNumber: "01",
      icon: Target,
      titleKey: "step1Title",
      descriptionKey: "step1Description",
    },
    {
      id: "step-2",
      stepNumber: "02",
      icon: CheckSquare,
      titleKey: "step2Title",
      descriptionKey: "step2Description",
    },
    {
      id: "step-3",
      stepNumber: "03",
      icon: Rocket,
      titleKey: "step3Title",
      descriptionKey: "step3Description",
    },
  ];

  return (
    <section id="features" className="py-20 bg-white dark:bg-page relative overflow-hidden">
      <div className="absolute top-1/2 start-1/2 ltr:-translate-x-1/2 rtl:translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-sky-100/60 dark:bg-sky-950/20 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <Reveal>
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100/80 dark:bg-slate-800 text-primary dark:text-sky-300 font-extrabold text-xs sm:text-sm">
              <Zap className="w-4 h-4 text-primary fill-primary/20" />
              <span>{t("eyebrow")}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-readex">
              {t("title")}
            </h2>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {t("description")}
            </p>
          </div>
        </Reveal>

        <div className="relative">
          <div className="hidden md:block absolute top-27.5 right-[15%] left-[15%] h-0.5 border-t-2 border-dashed border-sky-200 dark:border-slate-700 pointer-events-none z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative z-10">
            {steps.map((step, index) => (
              <Reveal key={step.id} delay={index * 100}>
                <div className="group relative bg-sky-50/40 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/90 rounded-3xl p-8 lg:p-10 text-center flex flex-col items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 border border-sky-100/70 dark:border-slate-700/50">
                  <span className="text-[11px] font-black tracking-wider text-primary dark:text-sky-300 bg-sky-100 dark:bg-slate-700 px-3 py-1 rounded-full mb-6 shadow-xs">
                    {t("stepNumber", { number: step.stepNumber })}
                  </span>

                  <div className="w-20 h-20 rounded-2xl bg-sky-100/90 dark:bg-slate-700/80 text-primary dark:text-sky-300 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <step.icon className="w-10 h-10 stroke-[2.2]" />
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 font-readex group-hover:text-primary transition-colors">{t(step.titleKey)}</h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-xs">{t(step.descriptionKey)}</p>

                  {index < steps.length - 1 && (
                    <div className="hidden md:flex absolute top-25.5 -start-6 lg:-start-8 z-20 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 items-center justify-center text-primary shadow-xs">
                      <ChevronLeft className="w-5 h-5 stroke-[2.5] ltr:-scale-x-100" />
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
