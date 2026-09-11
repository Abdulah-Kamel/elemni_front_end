"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { Link, useRouter } from "@/src/i18n/navigation";
import { notifyStudentSessionChanged } from "@/src/lib/student-api/session-events";
import AuthCard from "./auth-card";

type AuthMode = "login" | "register";

function errorMessage(status: number, detail?: string) {
  if (status === 401) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (status === 403) return "هذا الحساب غير متاح حالياً.";
  if (status === 409) return "يوجد حساب مسجل بهذا البريد الإلكتروني بالفعل.";
  if (status === 422) return "راجع البيانات المدخلة وحاول مرة أخرى.";
  return detail || "تعذر الاتصال بالخادم. حاول مرة أخرى.";
}

function Field({
  id,
  label,
  icon: Icon,
  children,
  hint,
}: {
  id: string;
  label: string;
  icon: typeof Mail;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-[#464555] dark:text-slate-300">
        {label}
      </label>
      <div className="group relative">
        <Icon className="pointer-events-none absolute end-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#777587] transition-colors group-focus-within:text-primary dark:text-slate-400" />
        {children}
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-[#777587] dark:text-slate-400">{hint}</p>}
    </div>
  );
}

const inputClass =
  "h-12 w-full rounded-lg border border-[#E2E0EF] bg-white pe-11 ps-4 text-sm text-[#1B1B24] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#A6A3B5] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500";
const ltrInputClass =
  "h-12 w-full rounded-lg border border-[#E2E0EF] bg-white py-0 pl-11 pr-4 text-left text-sm text-[#1B1B24] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#A6A3B5] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500";

export default function StudentAuthForm({ mode, returnTo }: { mode: AuthMode; returnTo?: string }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [isHydrated, setIsHydrated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Keep the native form disabled until the client submit handler is attached.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const passwordConfirmation = String(form.get("password_confirmation") ?? "");
    if (isRegister && password !== passwordConfirmation) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setSubmitting(true);
    const endpoint = isRegister
      ? "/api/student/auth/register"
      : "/api/student/auth/login";
    const payload = {
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      password,
      ...(isRegister
        ? {
            name: String(form.get("name") ?? "").trim(),
            phone_number: String(form.get("phone_number") ?? "").replace(/\s/g, ""),
          }
        : {}),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      setError(errorMessage(response?.status ?? 503, body?.detail));
      setSubmitting(false);
      return;
    }

    notifyStudentSessionChanged("login");
    router.replace(!isRegister && returnTo ? returnTo : "/onboarding");
  };

  return (
    <div className="w-full max-w-[500px] animate-fade-up">
      <AuthCard>
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-black leading-9 text-[#1B1B24] dark:text-white">
            {isRegister ? "إنشاء حساب جديد" : "أهلاً بيك من تاني"}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[#777587] dark:text-slate-400">
            {isRegister
              ? "ابدأ رحلتك التعليمية في أقل من دقيقة"
              : "سجّل دخولك وكمّل مذاكرتك من حيث توقفت"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <Field id="name" label="الاسم بالكامل" icon={UserRound}>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                placeholder="اكتب اسمك بالكامل"
                className={inputClass}
              />
            </Field>
          )}

          <Field id="email" label="البريد الإلكتروني" icon={Mail}>
            <input
              id="email"
              name="email"
              type="email"
              dir="ltr"
              autoComplete="email"
              required
              placeholder="student@example.com"
              className={ltrInputClass}
            />
          </Field>

          {isRegister && (
            <Field id="phone_number" label="رقم الموبايل" icon={Phone}>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                dir="ltr"
                autoComplete="tel"
                inputMode="tel"
                required
                maxLength={20}
                pattern="[0-9+ ]{10,20}"
                placeholder="010 1234 5678"
                className={ltrInputClass}
              />
            </Field>
          )}

          <Field
            id="password"
            label="كلمة المرور"
            icon={LockKeyhole}
            hint={isRegister ? "8 أحرف على الأقل" : undefined}
          >
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={8}
              className={`${inputClass} ps-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              className="absolute start-2.5 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-[#777587] hover:bg-primary-light hover:text-primary dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-sky-300"
            >
              {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
            </button>
          </Field>

          {isRegister && (
            <Field id="password_confirmation" label="تأكيد كلمة المرور" icon={LockKeyhole}>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                className={`${inputClass} ps-11`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((current) => !current)}
                aria-label={showConfirmation ? "إخفاء تأكيد كلمة المرور" : "إظهار تأكيد كلمة المرور"}
                className="absolute start-2.5 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-[#777587] hover:bg-primary-light hover:text-primary dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-sky-300"
              >
                {showConfirmation ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
              </button>
            </Field>
          )}

          {!isRegister && (
            <div className="text-start">
              <Link href="/forgot-password" className="text-sm font-bold text-primary hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              <CircleAlert className="mt-0.5 size-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!isHydrated || submitting}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-white transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? (
              <><LoaderCircle className="size-5 animate-spin" /> جاري المتابعة...</>
            ) : (
              <>{isRegister ? "إنشاء الحساب" : "تسجيل الدخول"}<ArrowLeft className="size-4.5" /></>
            )}
          </button>
        </form>

        {isRegister && (
          <p className="mt-5 text-center text-xs leading-5 text-[#777587] dark:text-slate-400">
            بإنشاء حساب، أنت توافق على الشروط وسياسة الخصوصية.
          </p>
        )}
      </AuthCard>

      <p className="mt-6 text-center text-sm text-[#464555] dark:text-slate-400">
        {isRegister ? "عندك حساب بالفعل؟ " : "مش عندك حساب؟ "}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="font-bold text-primary hover:underline"
        >
          {isRegister ? "تسجيل الدخول" : "إنشاء حساب جديد"}
        </Link>
      </p>
    </div>
  );
}
