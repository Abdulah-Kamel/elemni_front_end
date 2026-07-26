import React from 'react';
import { Wallet, CreditCard, CheckCircle, Building2 } from 'lucide-react';

interface PaymentMethodsProps {
  onFindLocations?: () => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = () => {
  const paymentOptions = [
    {
      id: 'wallet',
      icon: Wallet,
      title: 'المحافظ الإلكترونية',
      desc: 'فودافون كاش، أورنج كاش، اتصالات كاش، وي باي',
      badge: 'دفع فوري',
      color: 'from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    },
    {
      id: 'card',
      icon: CreditCard,
      title: 'البطاقات البنكية',
      desc: 'فيزا، ماستركارد، ميزة، جميع الكروت المباشرة',
      badge: 'آمن 100%',
      color: 'from-blue-500/10 to-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400',
      iconBg: 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
    },
  ];

  const governorates = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الشرقية', 'الدقهلية', 'البحيرة', 'المنيا', 'أسيوط', 'سوهاج', 'طنطا / الغربية'];

  return (
    <section id="payment-locations" className="py-16 sm:py-20 bg-gradient-to-b from-sky-50/50 via-white to-sky-50/30 dark:from-slate-900 dark:via-[#0B132B] dark:to-slate-900 relative overflow-hidden">
      
      {/* Background Glow Accents */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-200/40 dark:bg-sky-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Main Section Outer Card */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[36px] p-8 sm:p-12 lg:p-16 border border-sky-100 dark:border-slate-700/80 shadow-xl shadow-sky-900/5">
          
          {/* Header */}
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100/80 dark:bg-slate-700 text-primary dark:text-sky-300 font-extrabold text-xs sm:text-sm shadow-xs">
              <Building2 className="w-4 h-4 text-primary" />
              <span>شحن الحساب وشراء الكورسات</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-cairo">
              خطواتك للنجاح بقت أسهل.. <span className="text-primary dark:text-sky-400">وأقرب ليك!</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              وفرنالك طرق دفع إلكترونية آمنة وسريعة لشحن حسابك والاشتراك في الكورسات بكل سهولة عشان تبدأ مذاكرتك فوراً.
            </p>
          </div>

          {/* 2 Payment Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {paymentOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.id}
                  className="bg-white dark:bg-slate-900/90 rounded-2xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Icon & Badge */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl ${option.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 stroke-[2.2]" />
                      </div>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                        {option.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 font-cairo group-hover:text-primary transition-colors">
                      {option.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                      {option.desc}
                    </p>
                  </div>

                  {/* Bottom Guarantee indicator */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle className="w-4 h-4" />
                    <span>متاح حالياً للدفع المباشر</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Support & Quick Recharge Box */}
          <div className="mt-10 bg-sky-50/80 dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-sky-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-md">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-slate-900 dark:text-white font-black text-base sm:text-lg">
                  تحتاج مساعدة في خطوة الشحن أو الدفع؟
                </p>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-medium">
                  فريق الدعم الفني جاهز لمساعدتك وإتمام تفعيل حسابك وفوري في أي وقت.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <a
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto py-3.5 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <span>تواصل مع الدعم الفني</span>
            </a>

          </div>

        </div>

      </div>
    </section>
  );
};
