"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { Link } from "@/src/i18n/navigation";
import { useTranslations } from "next-intl";
import AuthCard from "./auth-card";

const inputClass =
  "h-12 w-full rounded-lg border border-[#E2E0EF] bg-white pe-11 ps-4 text-sm text-[#1B1B24] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#A6A3B5] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500";
const ltrInputClass =
  "h-12 w-full rounded-lg border border-[#E2E0EF] bg-white py-0 pl-11 pr-4 text-left text-sm text-[#1B1B24] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder:text-[#A6A3B5] dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500";

export function ForgotPasswordForm() {
  const t = useTranslations("passwordRecovery");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/student/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(form.get("email") ?? "").trim().toLowerCase() }),
    }).catch(() => null);

    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.code === "EMAIL_REQUIRED" ? t("emailRequired") : body?.detail ?? t("genericForgotError"));
      setSubmitting(false);
      return;
    }
    setSent(true);
    setSubmitting(false);
  };

  return (
    <div className="w-full max-w-[500px] animate-fade-up">
      <AuthCard>
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-black text-[#1B1B24] dark:text-white">{t("forgotTitle")}</h1>
          <p className="mt-2 text-sm leading-6 text-[#777587] dark:text-slate-400">
            {t("forgotDescription")}
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-11 text-emerald-600" />
            <h2 className="mt-4 text-lg font-black text-[#1B1B24] dark:text-white">{t("checkEmail")}</h2>
            <p className="mt-2 text-sm leading-6 text-[#777587] dark:text-slate-400">
              {t("sentDescription")}
            </p>
            <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-hover">
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-bold text-[#464555] dark:text-slate-300">{t("email")}</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute end-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#777587] dark:text-slate-400" />
                <input id="email" name="email" type="email" dir="ltr" autoComplete="email" required placeholder="student@example.com" className={ltrInputClass} />
              </div>
            </div>
            {error && <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"><CircleAlert className="size-4.5 shrink-0" />{error}</div>}
            <button type="submit" disabled={submitting} className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70">
              {submitting && <LoaderCircle className="size-5 animate-spin" />}
              {submitting ? t("sending") : t("sendLink")}
            </button>
          </form>
        )}
      </AuthCard>
      {!sent && <p className="mt-6 text-center text-sm"><Link href="/login" className="font-bold text-primary hover:underline">{t("backToLogin")}</Link></p>}
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("passwordRecovery");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("password_confirmation") ?? "");
    if (password !== confirmation) {
      setError(t("resetMismatch"));
      return;
    }

    setSubmitting(true);
    setError("");
    const response = await fetch("/api/student/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password: password }),
    }).catch(() => null);
    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.code === "RESET_FIELDS_REQUIRED" || response?.status === 400 ? t("resetInvalid") : body?.detail ?? t("genericResetError"));
      setSubmitting(false);
      return;
    }
    setComplete(true);
    setSubmitting(false);
  };

  return (
    <div className="w-full max-w-[500px] animate-fade-up">
      <AuthCard>
        {complete ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto size-11 text-emerald-600" />
            <h1 className="mt-4 text-2xl font-black text-[#1B1B24] dark:text-white">{t("updated")}</h1>
            <p className="mt-2 text-sm text-[#777587] dark:text-slate-400">{t("updatedDescription")}</p>
            <Link href="/login" className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-white hover:bg-primary-hover">{t("login")}</Link>
          </div>
        ) : (
          <>
            <div className="mb-7 text-center">
              <h1 className="text-2xl font-black text-[#1B1B24] dark:text-white">{t("newPassword")}</h1>
              <p className="mt-2 text-sm text-[#777587] dark:text-slate-400">{t("passwordHint")}</p>
            </div>
            {!token ? (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">{t("incompleteLink")}</div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                {[{ id: "password", label: t("newPasswordLabel") }, { id: "password_confirmation", label: t("confirmPassword") }].map((field) => (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="mb-1.5 block text-xs font-bold text-[#464555] dark:text-slate-300">{field.label}</label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute end-3.5 top-1/2 size-4.5 -translate-y-1/2 text-[#777587] dark:text-slate-400" />
                      <input id={field.id} name={field.id} type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} className={`${inputClass} ps-11`} />
                      <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? t("hidePassword") : t("showPassword")} className="absolute start-2.5 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-[#777587] hover:bg-primary-light hover:text-primary dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-sky-300">
                        {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                      </button>
                    </div>
                  </div>
                ))}
                {error && <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"><CircleAlert className="size-4.5 shrink-0" />{error}</div>}
                <button type="submit" disabled={submitting} className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70">
                  {submitting && <LoaderCircle className="size-5 animate-spin" />}{submitting ? t("saving") : t("savePassword")}
                </button>
              </form>
            )}
          </>
        )}
      </AuthCard>
    </div>
  );
}
