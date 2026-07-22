import { TESTIMONIALS } from "../../data/mock-data";
import { Quote, Award, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/src/components/ui/reveal";

export default function Testimonials() {
  return (
    <section className="py-20 bg-[#F8FAFC] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center space-y-3 max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light text-primary font-bold text-xs sm:text-sm">
              <Award className="w-4 h-4" />
              <span>قصص نجاح وتفوق حقيقية</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] font-cairo">ماذا يقول أوائل الطلاب عن علمني؟</h2>
            <p className="text-sm sm:text-base text-[#334155]">
              شاهد كيف ساهمت المنصة والمعلمون في مساعدة آلاف الطلاب على تحقيق درجات متقدمة والانضمام لكليات أحلامهم.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.id} delay={i * 80}>
              <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col justify-between relative h-full">
                <Quote className="w-10 h-10 text-primary-light absolute top-6 left-6 -scale-x-100" />
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>المجموع: {t.score}</span>
                  </div>
                  <p className="text-sm text-[#334155] leading-relaxed font-medium mb-6 text-right relative z-10">&quot;{t.comment}&quot;</p>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary-light" />
                  <div className="text-right">
                    <h4 className="font-extrabold text-sm text-[#0F172A]">{t.name}</h4>
                    <p className="text-xs text-primary font-bold">{t.grade}</p>
                    <p className="text-[10px] text-slate-400">{t.school}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
