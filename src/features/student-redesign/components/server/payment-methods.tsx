import { Wallet, CreditCard, CheckCircle, Building2 } from "lucide-react";
import { Section } from "@/src/components/ui/section";
import { Reveal } from "@/src/components/ui/reveal";

export default function PaymentMethods() {
  const paymentOptions = [
    {
      id: "wallet",
      icon: Wallet,
      title: "المحافظ الإلكترونية",
      desc: "فودافون كاش، أورنج كاش، اتصالات كاش، وي باي",
      badge: "دفع فوري",
      iconBg: "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400",
    },
    {
      id: "card",
      icon: CreditCard,
      title: "البطاقات البنكية",
      desc: "فيزا، ماستركارد، ميزة، جميع الكروت المباشرة",
      badge: "آمن 100%",
      iconBg: "bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400",
    },
  ];

  return (
    <Section id="payment-locations" className="bg-gradient-to-b from-sky-50/50 via-white to-sky-50/30 dark:from-slate-900 dark:via-[#0B132B] dark:to-slate-900">
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[36px] p-8 sm:p-12 border border-sky-100 dark:border-slate-700/80 shadow-xl">
        <Reveal>
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light text-primary font-extrabold text-xs sm:text-sm">
              <Building2 className="w-4 h-4 text-primary" />
              <span>شحن الحساب وشراء الكورسات</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink tracking-tight font-cairo">
              خطواتك للنجاح بقت أسهل.. <span className="text-primary">وأقرب ليك!</span>
            </h2>
            <p className="text-base sm:text-lg text-muted leading-relaxed font-medium">
              وفرنالك طرق دفع إلكترونية آمنة وسريعة.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {paymentOptions.map((option, i) => (
            <Reveal key={option.id} delay={i * 80}>
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-14 h-14 rounded-2xl ${option.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <option.icon className="w-7 h-7 stroke-[2.2]" />
                    </div>
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-muted border border-slate-200/60 dark:border-slate-700">
                      {option.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-ink mb-2 font-cairo group-hover:text-primary transition-colors">{option.title}</h3>
                  <p className="text-sm text-muted leading-relaxed font-medium">{option.desc}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>متاح حالياً للدفع المباشر</span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mt-10 bg-sky-50/80 dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-sky-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-ink font-black text-base sm:text-lg">تحتاج مساعدة في خطوة الشحن أو الدفع؟</p>
                <p className="text-muted text-xs sm:text-sm font-medium">فريق الدعم الفني جاهز لمساعدتك.</p>
              </div>
            </div>
            <a href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer"
              className="w-full sm:w-auto py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-center">
              تواصل مع الدعم الفني
            </a>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
