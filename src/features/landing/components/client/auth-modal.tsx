"use client";

import { useState } from "react";
import { X, User, Phone, Lock, GraduationCap, ArrowLeft, LoaderCircle, Mail, CircleAlert } from "lucide-react";
import { cn } from "@/src/lib/cn";
import { notifyStudentSessionChanged } from "@/src/lib/student-api/session-events";

interface AuthModalProps {
  isOpen: boolean;
  initialMode: "signin" | "signup";
  onClose: () => void;
  onSuccess: (userName: string) => void;
}

export default function AuthModal({ isOpen, initialMode, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError("");

    const endpoint = mode === "signup" ? "/api/student/auth/register" : "/api/student/auth/login";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        ...(mode === "signup" ? { name, phone_number: phone } : {}),
      }),
    }).catch(() => null);

    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.detail ?? "تعذر الاتصال بالخادم. حاول مرة أخرى.");
      setSubmitted(false);
      return;
    }

    const user = await response.json();
    notifyStudentSessionChanged("login");
    onSuccess(user.name ?? name ?? "الطالب");
    onClose();
    setSubmitted(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-slate-100 text-end">
        <button
          onClick={onClose}
          className="absolute top-5 start-5 p-2 text-slate-400 hover:text-[#0F172A] hover:bg-slate-100 rounded-full transition-all cursor-pointer"
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
            onClick={() => { setMode("signup"); setError(""); }}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer",
              mode === "signup" ? "bg-white text-primary shadow-sm" : "text-[#334155]"
            )}
          >
            حساب جديد
          </button>
          <button
            onClick={() => { setMode("signin"); setError(""); }}
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
                  className="w-full pe-10 ps-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <User className="w-4 h-4 text-slate-400 absolute end-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                dir="ltr"
                className="w-full pe-10 ps-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute end-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-[#334155] mb-1">رقم الموبايل (أو الواتساب)</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  dir="ltr"
                  className="w-full pe-10 ps-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute end-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#334155] mb-1">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pe-10 ps-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute end-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitted}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-extrabold text-sm rounded-xl shadow-lg shadow-primary/25 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 font-cairo"
          >
            {submitted ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="w-4 h-4 animate-spin" /> جاري الاتصال...
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
