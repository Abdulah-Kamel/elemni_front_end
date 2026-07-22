import { CircleCheck, CircleX, Star } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

const withoutStudy = [
  "تشتت في المنهج ومش عارف تبدأ منين",
  "مفيش حد يجاوب على أسئلتك",
  "بتضيع وقت كتير في البحث عن شرح",
  "نفسياً متعب ومش لاقي حافز",
];

const withStudy = [
  "خطة مذاكرة واضحة ومنظمة",
  "معلمك متاح مباشرة يساعدك",
  "فيديوهات شرح وبنوك أسئلة كل حاجة في مكان واحد",
  "متابعة أسبوعية وتحفيز مستمر",
];

export default function BeforeAfter() {
  return (
    <Section id="before-after">
      <Reveal>
        <h2 className="mb-3 text-center text-3xl font-bold tracking-tight text-[#0F172A] md:text-4xl font-cairo">الفرق قبل وبعد علمني</h2>
        <p className="mx-auto mb-10 max-w-2xl text-center text-[#334155]">شوف الفرق بنفسك وقرر تبدأ امتى.</p>
      </Reveal>
      <div className="grid gap-6 md:grid-cols-2">
        <Reveal className="h-full">
          <div className="h-full rounded-2xl border border-rose-200 bg-rose-50/60 p-8">
            <span className="mb-4 grid size-10 place-items-center rounded-full bg-rose-100 text-rose-600"><CircleX className="size-5" /></span>
            <h3 className="mb-4 text-xl font-black text-rose-700 font-cairo">قبل علمني</h3>
            <ul className="space-y-3">
              {withoutStudy.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-rose-800">
                  <CircleX className="mt-0.5 size-4 shrink-0 text-rose-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={100} className="h-full">
          <div className="h-full rounded-2xl border border-emerald-200 bg-emerald-50/60 p-8">
            <span className="mb-4 grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-600"><Star className="size-5" /></span>
            <h3 className="mb-4 text-xl font-black text-emerald-700 font-cairo">بعد علمني</h3>
            <ul className="space-y-3">
              {withStudy.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-emerald-800">
                  <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
