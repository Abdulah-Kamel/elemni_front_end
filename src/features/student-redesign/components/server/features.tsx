import { Video, FileQuestion, BarChart2, BookOpen, Check, Sparkles, Monitor, Zap } from "lucide-react";
import { FEATURES_DATA } from "../../data/mock-data";
import { Reveal } from "@/src/components/ui/reveal";

interface FeaturesProps {
  onExploreFeature: (featureId: string) => void;
}

export default function Features({ onExploreFeature }: FeaturesProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Video": return <Video className="w-8 h-8 text-primary" />;
      case "FileText": return <FileQuestion className="w-8 h-8 text-primary" />;
      case "BarChart3": return <BarChart2 className="w-8 h-8 text-primary" />;
      case "BookOpenCheck": return <BookOpen className="w-8 h-8 text-primary" />;
      default: return <Sparkles className="w-8 h-8 text-primary" />;
    }
  };

  return (
    <section id="features" className="py-20 bg-white relative overflow-hidden">
      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-primary-light rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <Reveal>
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light text-primary font-bold text-xs sm:text-sm">
              <Zap className="w-4 h-4" />
              <span>بيئة تعليمية ذكية ومتكاملة</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] tracking-tight font-cairo">ليه احنا ؟</h2>
            <p className="text-base sm:text-lg text-[#334155] leading-relaxed">
              صُممت منصة علمني وفق أحدث تقنيات التعلم الإلكتروني لتضمن لك الفهم العميق، التدريب المتواصل، والمتابعة الدقيقة حتي ليلة الامتحان.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES_DATA.slice(0, 3).map((feature, i) => (
            <Reveal key={feature.id} delay={i * 80}>
              <div className="bg-[#F8FAFC] rounded-3xl p-8 border border-slate-200/80 hover:bg-white hover:border-primary/40 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group h-full">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <div className="group-hover:text-white transition-colors">{getIcon(feature.icon)}</div>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-md inline-block mb-2">{feature.subtitle}</span>
                  <h3 className="text-2xl font-black text-[#0F172A] mb-3 group-hover:text-primary transition-colors font-cairo">{feature.title}</h3>
                  <p className="text-sm text-[#334155] leading-relaxed mb-6">{feature.description}</p>
                  <ul className="space-y-2.5 pt-4 border-t border-slate-200/60 mb-6">
                    {feature.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 font-semibold">
                        <div className="w-4 h-4 rounded-full bg-primary-light text-primary flex items-center justify-center mt-0.5 shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => onExploreFeature(feature.id)} className="w-full py-3 px-4 bg-white hover:bg-primary text-primary hover:text-white font-bold text-xs rounded-xl border border-primary/30 hover:border-transparent transition-all cursor-pointer shadow-sm text-center">
                  معرفة المزيد حول {feature.title.split(" ")[0]}
                </button>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-16 bg-gradient-to-r from-[#0F172A] via-primary to-[#0F172A] rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8 space-y-3 text-right">
                <span className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full inline-block backdrop-blur-md">تطبيق الموبيل والتابلت الحصري</span>
                <h3 className="text-2xl sm:text-3xl font-black font-cairo leading-tight">ذاكر في أي وقت ومن أي مكان مع تطبيق علمني</h3>
                <p className="text-sm text-slate-200 leading-relaxed max-w-2xl">
                  حمل التطبيق المجاني لمتابعة الدروس المباشرة، حل الأسئلة وتلقي الإشعارات التنبيهية بمواعيد الامتحانات الحصرية على هاتفك.
                </p>
              </div>
              <div className="md:col-span-4 flex justify-center md:justify-end gap-3">
                <button onClick={() => alert("سيتم تحويلك لتحميل تطبيق علمني للأندرويد والأيفون")} className="px-6 py-3.5 bg-white text-[#0F172A] hover:bg-primary-light font-extrabold text-sm rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-primary" />
                  <span>حمل التطبيق الآن</span>
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
