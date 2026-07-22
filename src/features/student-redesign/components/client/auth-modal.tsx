"use client";

import { useState } from "react";
import { X, User, Phone, Lock, GraduationCap, ArrowLeft, CheckCircle } from "lucide-react";
import { cn } from "@/src/lib/cn";

interface AuthModalProps {
  isOpen: boolean;
  initialMode: "signin" | "signup";
  onClose: () => void;
  onSuccess: (userName: string) => void;
}

export default function AuthModal({ isOpen, initialMode, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState("sec3");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onSuccess(name || "الطالب الجديد");
      onClose();
      setSubmitted(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 text-right">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#0F172A] font-cairo">
              {mode === "signup" ? "إنشاء حساب طالب جديد" : "تسجيل الدخول لمنصة علمني"}
            </h3>
            <p className="text-xs text-[#334155]">
              {mode === "signup" ? "انضم لأكثر من 50,000 طالب متفوق اليوم" : "أهلاً بعودتك! ادخل بيانات حسابك للمتابعة"}
            </p>
          </div>
        </div>

        <div className="flex rounded-xl bg-[#F8FAFC] p-1 border border-slate-200/80 mb-6">
          <button
            onClick={() => setMode("signup")}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer",
              mode === "signup" ? "bg-white text-primary shadow-sm" : "text-[#334155]"
            )}
          >
            حساب جديد
          </button>
          <button
            onClick={() => setMode("signin")}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer",
              mode === "signin" ? "bg-white text-primary shadow-sm" : "text-[#334155]"
            )}
          >
            تسجيل الدخول
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">اسم الطالب رباعي</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك الكامل..."
                  className="w-full pr-10 pl-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">رقم الموبايل (أو الواتساب)</label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full pr-10 pl-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">الصف الدراسي</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full pr-4 pl-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="sec3">الصف الثالث الثانوي (الثانوية العامة)</option>
                <option value="sec2">الصف الثاني الثانوي</option>
                <option value="sec1">الصف الأول الثانوي</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10 pl-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitted}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-extrabold text-sm rounded-xl shadow-lg shadow-primary/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 font-cairo"
          >
            {submitted ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 animate-spin" /> جاري الحفظ...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {mode === "signup" ? "تأكيد ودخول المنصة" : "تسجيل الدخول"}
                <ArrowLeft className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-4">
          بالمتابعة فإنك توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بمنصة علمني.
        </p>
      </div>
    </div>
  );
}
