import React from 'react';
import { GraduationCap, Phone, Mail, MapPin, Facebook, Youtube, Instagram, Send, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0F172A] text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800 text-right">
          
          {/* Brand Info (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white font-cairo">
                علمني <span className="text-primary font-bold text-xs bg-primary/20 px-2 py-0.5 rounded-md border border-primary/40">ELEMNI</span>
              </span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-md font-normal">
              منصة علمني هي البوابة التعليمية الذكية الأولى الرائدة للدروس المباشرة التفاعلية، بنوك الأسئلة، وكورسات المعلمين الشاملة لطلاب الثانوية العامة والصفوف الدراسية.
            </p>

            <div className="pt-2 flex items-center gap-3 text-slate-400">
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links 1 */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-primary-light font-cairo border-r-2 border-primary pr-2">
              روابط السريعة
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#hero" className="hover:text-white transition-colors">الرئيسية</a></li>
              <li><a href="#teachers" className="hover:text-white transition-colors">المدرسون والكورسات</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">المميزات والتطبيقات</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">الأسئلة الشائعة</a></li>
            </ul>
          </div>

          {/* Quick Links 2 */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-primary-light font-cairo border-r-2 border-primary pr-2">
              المناهج والدعم
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#teachers" className="hover:text-white transition-colors">الصف الثالث الثانوي</a></li>
              <li><a href="#teachers" className="hover:text-white transition-colors">الصف الثاني الثانوي</a></li>
              <li><a href="#teachers" className="hover:text-white transition-colors">الصف الأول الثانوي</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">الأسئلة الشائعة</a></li>
              <li><a href="#" className="hover:text-white transition-colors">سياسة الخصوصية والاستخدام</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-primary-light font-cairo border-r-2 border-primary pr-2">
              تواصل معنا
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>+20 100 123 4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                <span>support@elemni.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>القاهرة، جمهورية مصر العربية</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-right">
          <p>© 2026 منصة علمني (ELEMNI). جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1 justify-center">
            <span>صُنعت بشغف للتعلم الذكي</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
          </p>
        </div>

      </div>
    </footer>
  );
};
