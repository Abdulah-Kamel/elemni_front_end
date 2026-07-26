import React from 'react';
import { UserPlus, Sparkles, CheckCircle2, ArrowLeft, ShieldCheck, TrendingUp } from 'lucide-react';

interface TeacherJoinCTAProps {
  onJoinAsTeacher?: () => void;
}

export const TeacherJoinCTA: React.FC<TeacherJoinCTAProps> = ({ onJoinAsTeacher }) => {
  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-[#0B132B] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main CTA Container with Split Geometric Background */}
        <div className="relative rounded-[36px] sm:rounded-[44px] bg-[#0A263B] text-white overflow-hidden shadow-2xl border border-sky-900/60 flex flex-col lg:flex-row items-stretch">
          
          {/* LEFT SIDE: Light Sky Blue Geometric Background with Teacher Cutout Frame */}
          <div className="lg:w-[42%] bg-[#CBE4F9] relative p-6 sm:p-10 flex items-center justify-center overflow-hidden min-h-[380px] sm:min-h-[440px]">
            
            {/* Dark Navy Geometric Diagonal Stripes */}
            <div className="absolute -top-12 -right-16 w-52 h-96 bg-[#0A263B] -rotate-45 transform pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-52 h-96 bg-[#0A263B] -rotate-45 transform pointer-events-none" />
            <div className="absolute top-1/2 left-0 w-32 h-64 bg-[#0A263B] -rotate-12 transform pointer-events-none opacity-90" />

            {/* Inner Light Sky Frame for Teacher Image */}
            <div className="relative z-10 w-full max-w-[320px] aspect-[4/5] rounded-[28px] border-2 border-sky-300/80 bg-[#C0DFF8] shadow-xl overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800"
                alt="معلم متميز على منصة علمني"
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          {/* RIGHT SIDE: Dark Navy Main Banner Content */}
          <div className="lg:w-[58%] p-8 sm:p-12 lg:p-14 flex flex-col justify-center space-y-6 text-right relative z-10">
            
            {/* Top Badge */}
            <div className="self-start inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#133A57] border border-sky-600/30 text-sky-300 font-extrabold text-xs sm:text-sm shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>انضم لكادر المعلمين المتميزين</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight font-cairo">
              انضم لنخبة المعلمين على منصة <span className="text-amber-400">علمني</span>
            </h2>

            {/* Subtitle Paragraph */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium max-w-xl">
              شارك في بناء مستقبل التعليم الرقمي، قدم محتواك لآلاف الطلاب واستفد من تقنياتنا المتطورة في إدارة كورساتك ومتابعة طلابك بكل سهولة.
            </p>

            {/* 3 Feature Boxes in a Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center justify-center gap-2 bg-[#0E334D]/90 border border-sky-800/60 rounded-xl p-3 text-center">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">توسع وانتشار لآلاف الطلاب</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-[#0E334D]/90 border border-sky-800/60 rounded-xl p-3 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">حماية كاملة للمحتوى والدروس</span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-[#0E334D]/90 border border-sky-800/60 rounded-xl p-3 text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200">أدوات سهلة لإدارة الكورسات</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 flex items-center justify-start">
              <button
                onClick={onJoinAsTeacher}
                className="w-full sm:w-auto py-3.5 px-8 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base rounded-2xl shadow-lg shadow-amber-400/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-3 group"
              >
                <ArrowLeft className="w-5 h-5 text-slate-950 group-hover:-translate-x-1 transition-transform" />
                <span>انضم إلينا كمعلم</span>
                <UserPlus className="w-5 h-5 text-slate-950" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

