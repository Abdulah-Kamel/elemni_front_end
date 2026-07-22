import { ArrowLeft } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";
import { cn } from "@/src/lib/cn";

const steps = [
  { num: 1, circleClass: "bg-amber-500" },
  { num: 2, circleClass: "bg-primary" },
  { num: 3, circleClass: "bg-emerald-500" },
];

export default function StepsSection() {
  return (
    <Section id="how">
      <Reveal>
        <h2 className="mb-3 text-center text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl font-cairo">ازاي تبدأ في ٣ خطوات بس</h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-[#334155]">ابدأ رحلة التفوق مع علمني من النهاردة.</p>
      </Reveal>
      <div className="relative grid gap-8 md:grid-cols-3">
        <div aria-hidden className="absolute inset-x-[16%] top-6 hidden border-t-2 border-dashed border-amber-400/60 md:block" />
        {steps.map((step, i) => (
          <Reveal key={step.num} delay={i * 100} className="relative">
            <div className="flex flex-col items-center text-center">
              <div className={cn("relative z-10 grid size-12 place-items-center rounded-full text-lg font-black text-white shadow-lg", step.circleClass)}>
                {step.num}
              </div>
              <h3 className="mt-4 text-lg font-bold text-[#0F172A] font-cairo">
                {["إنشاء حساب", "اختر المدرس والكورس", "ابدأ التعلم المباشر"][i]}
              </h3>
              <p className="mt-1 text-sm text-[#334155]">
                {[
                  "سجل مجاناً باستخدام هاتفك في أقل من دقيقة وابدأ رحلتك.",
                  "تصفح المدرسين المتخصصين واختر الكورس المناسب لمادتك.",
                  "احضر الحصص المباشرة، حل الأسئلة، وتابع تقدمك أولاً بأول."
                ][i]}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
