"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "../../data/mock-data";
import { ChevronDown, HelpCircle, MessageSquare } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { Reveal } from "@/src/components/ui/reveal";

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>("faq1");

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-20 bg-white relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-light text-primary font-bold text-xs sm:text-sm">
              <HelpCircle className="w-4 h-4" />
              <span>إجابات سريعة لاستفساراتك</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0F172A] font-cairo">الأسئلة الشائعة</h2>
            <p className="text-sm sm:text-base text-[#334155]">
              كل ما تحتاج معرفته عن التسجيل، الحصص المباشرة، وطرق الاشتراك على منصة علمني.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className={cn(
                  "rounded-2xl border transition-all overflow-hidden",
                  isOpen ? "border-primary bg-[#F8FAFC] shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                )}>
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full p-5 text-right font-bold text-base text-[#0F172A] flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  >
                    <span className="flex-1 font-cairo">{item.question}</span>
                    <div className={cn(
                      "w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 transition-transform duration-300",
                      isOpen ? "rotate-180 bg-primary text-white" : ""
                    )}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-[#334155] leading-relaxed text-right border-t border-slate-100">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-12 p-6 rounded-2xl bg-primary-light border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#0F172A]">هل لديك سؤال آخر؟</h4>
                <p className="text-xs text-[#334155]">فريق الدعم الفني متواجد لمساعدتك طوال اليوم عبر الواتساب.</p>
              </div>
            </div>
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary-hover transition-all shadow-md shrink-0"
            >
              تحدث مع الدعم الفني
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
