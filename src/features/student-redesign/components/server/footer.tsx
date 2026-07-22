import { GraduationCap, Phone, Mail, MapPin, Send, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800 text-right">
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
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-xl bg-slate-800/80 flex items-center justify-center hover:bg-primary hover:text-white transition-all"><Send className="w-4 h-4" /></a>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-primary-light font-cairo border-r-2 border-primary pr-2">روابط السريعة</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#hero" className="hover:text-white transition-colors">الرئيسية</a></li>
              <li><a href="#teachers" className="hover:text-white transition-colors">المدرسون والكورسات</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">المميزات والتطبيقات</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">الأسئلة الشائعة</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-primary-light font-cairo border-r-2 border-primary pr-2">المناهج والدعم</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><a href="#teachers" className="hover:text-white transition-colors">الصف الثالث الثانوي</a></li>
              <li><a href="#teachers" className="hover:text-white transition-colors">الصف الثاني الثانوي</a></li>
              <li><a href="#teachers" className="hover:text-white transition-colors">الصف الأول الثانوي</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">الأسئلة الشائعة</a></li>
              <li><a href="#" className="hover:text-white transition-colors">سياسة الخصوصية والاستخدام</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-extrabold text-primary-light font-cairo border-r-2 border-primary pr-2">تواصل معنا</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-primary" /><span>+20 100 123 4567</span></div>
              <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-primary" /><span>support@elemni.com</span></div>
              <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" /><span>القاهرة، جمهورية مصر العربية</span></div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 text-center sm:text-right">
          <p>© 2026 منصة علمني (ELEMNI). جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1 justify-center"><span>صُنعت بشغف للتعلم الذكي</span><Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /></p>
        </div>
      </div>
    </footer>
  );
}
