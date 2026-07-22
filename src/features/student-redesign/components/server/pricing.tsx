import { CheckCircle2, Zap, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { Reveal } from "@/src/components/ui/reveal";

interface PricingProps {
  onSelectPlan?: (planName: string) => void;
}

export default function Pricing({ onSelectPlan }: PricingProps) {
  const plans = [
    {
      id: "monthly",
      name: "اشتراك شهري",
      badge: "الخيار المرن",
      price: "250",
      period: "شهرياً",
      description: "مثالي للطلاب الراغبين في تجربة المدرسين ومتابعة المواد شهراً بشهر.",
      featured: false,
      features: [
        "وصول كامل لكورسات الشهر المختار",
        "حضور الحصص المباشرة والتسجيلات",
        "بنوك أسئلة وتصحيح الكتروني فورى",
        "متابعة مستوى الطالب ومجموعة نقاشية",
        "الدعم الفني والتعليمي عبر الواتساب"
      ],
      ctaText: "اشترك الآن شهرياً"
    },
    {
      id: "term",
      name: "اشتراك الفصل الدراسي",
      badge: "الأكثر توفيراً وإقبالاً",
      price: "850",
      period: "لكل ترم دراسي",
      discount: "وفر أكثر من 25%",
      description: "الباقة المتكاملة للترم الدراسي الكامل مع مراجعات ليلة الامتحان.",
      featured: true,
      features: [
        "وصول شامل لجميع كورسات الفصل الدراسي",
        "حضور كافة الحصص المباشرة والمراجعات النهائية",
        "بنك أسئلة شامل وحل امتحانات السنوات السابقة",
        "تقارير أسبوعية تفصيلية لولي الأمر",
        "أولوية الإجابة على الأسئلة مع المعلمين المباشرين",
        "خصم خاص على المذكرات والملخصات المطبوعة"
      ],
      ctaText: "اشترك الآن في الترم"
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-[#F8FAFC] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light text-primary font-bold text-xs sm:text-sm">
              <Zap className="w-4 h-4" />
              <span>باقات اشتراك تناسب الجميع</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight font-cairo">اختر خطة الاشتراك المناسبة لك</h2>
            <p className="text-base sm:text-lg text-[#334155] leading-relaxed">
              أسعار مناسبة وباقات مرنة تضمن لك التفوق الدراسي والوصول لكافة المعلمين والمواد المخصصة لصفك الدراسي.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 100}>
              <div className={cn(
                "rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between relative h-full",
                plan.featured ? "bg-white border-2 border-primary shadow-2xl scale-100 md:-translate-y-2" : "bg-white border border-slate-200/90 shadow-md hover:shadow-xl"
              )}>
                {plan.featured && (
                  <div className="absolute -top-4 right-8 bg-primary text-white font-extrabold text-xs px-4 py-1.5 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{plan.badge}</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-2xl font-black text-[#0F172A] font-cairo">{plan.name}</h3>
                    {!plan.featured && <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-md">{plan.badge}</span>}
                  </div>
                  <p className="text-xs text-[#334155] leading-relaxed mb-6">{plan.description}</p>
                  <div className="mb-6 p-4 bg-[#F8FAFC] rounded-2xl border border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-4xl font-black text-[#0F172A] font-cairo">{plan.price}</span>
                      <span className="text-sm font-bold text-slate-500 mr-1.5">ج.م</span>
                      <span className="text-xs text-slate-400 block mt-0.5">{plan.period}</span>
                    </div>
                    {plan.discount && <span className="text-xs font-bold text-[#22C55E] bg-[#22C55E]/10 px-2.5 py-1 rounded-lg border border-[#22C55E]/20">{plan.discount}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm font-semibold text-[#334155]">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => onSelectPlan && onSelectPlan(plan.name)} className={cn(
                  "w-full py-4 text-sm font-extrabold rounded-2xl transition-all cursor-pointer shadow-md font-cairo text-center",
                  plan.featured ? "bg-primary hover:bg-primary-hover text-white shadow-primary/30" : "bg-slate-100 hover:bg-primary-light text-[#0F172A] hover:text-primary"
                )}>{plan.ctaText}</button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            <span>ضمان استعادة الأموال خلال 7 أيام من التجربة في حال لم يناسبك الكورس</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
