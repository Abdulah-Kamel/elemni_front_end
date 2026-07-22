import { Sparkles, ArrowLeft, Play } from "lucide-react";
import { Reveal } from "@/src/components/ui/reveal";

interface HeroProps {
  onOpenAuth: (mode: "signup" | "signin") => void;
  onOpenVideoTour: () => void;
  onExploreTeachers: () => void;
}

export default function Hero({ onOpenAuth, onOpenVideoTour, onExploreTeachers }: HeroProps) {
  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-24 pb-12 overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 transition-colors">
      <div className="absolute top-12 right-10 w-96 h-96 bg-sky-200/40 dark:bg-sky-900/20 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-100/50 dark:bg-blue-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <Reveal className="lg:col-span-7 text-right space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-sky-200/80 dark:border-slate-700 text-sky-700 dark:text-sky-300 font-extrabold text-xs sm:text-sm shadow-sm">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400 animate-pulse" />
              <span>المنصة الأولى للتعلم التفاعلي وكورسات المدرسين 2026</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.25] tracking-tight font-cairo">
              علمني .. بوابتك <br />
              <span className="text-primary relative inline-block">
                للتعلم الذكي
                <svg className="absolute -bottom-2 right-0 w-full h-3 text-sky-200 dark:text-sky-900/60 -z-10" viewBox="0 0 200 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 10C50 3 150 3 198 10" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-w-2xl">
              هتلاقي مدرسك يعني هتلاقيه.
            </p>

            <div className="pt-2">
              <button
                onClick={() => onOpenAuth("signup")}
                className="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-extrabold text-base rounded-2xl shadow-xl shadow-primary/25 active:scale-95 transition-all cursor-pointer inline-flex items-center gap-3 group"
              >
                <span>ابدأ الآن</span>
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </Reveal>

          <Reveal delay={150} className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-sky-900/10 dark:shadow-none border border-slate-200/80 dark:border-slate-700 hover:shadow-sky-900/15 transition-all">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-slate-900 group">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800"
                  alt="حصص مباشرة على علمني"
                  className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                  <span>كورس الفيزياء المميز</span>
                </div>
                <button
                  onClick={onOpenVideoTour}
                  className="absolute inset-0 m-auto w-14 h-14 bg-white/95 text-primary rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all group-hover:bg-primary group-hover:text-white cursor-pointer"
                  aria-label="شاهد نموذج الشرح"
                >
                  <Play className="w-6 h-6 fill-current mr-0.5" />
                </button>
              </div>

              <div className="mt-3.5 text-right space-y-1">
                <span className="text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-slate-700 px-2.5 py-0.5 rounded-md inline-block">
                  الصف الثالث الثانوي
                </span>
                <p className="text-slate-900 dark:text-white font-bold text-sm leading-snug">حصة التمارين المتقدمة مع د. محمود صبري</p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-right">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2 space-x-reverse">
                    <img className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="Student 1" />
                    <img className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="Student 2" />
                    <img className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 object-cover" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100" alt="Student 3" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">+1,420 طالب مشترك</p>
                  </div>
                </div>
                <button onClick={onExploreTeachers} className="px-3.5 py-1.5 bg-sky-50 dark:bg-slate-700 text-primary dark:text-sky-300 font-bold text-xs rounded-xl hover:bg-primary hover:text-white transition-all cursor-pointer">انضم لهم</button>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
