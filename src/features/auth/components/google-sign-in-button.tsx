"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { loadGoogleIdentity, type GoogleCredentialResponse } from "@/src/features/auth/google-identity";
import { StudentApiError, studentApiFetch } from "@/src/lib/student-api/client";
import { notifyStudentSessionChanged } from "@/src/lib/student-api/session-events";

type GoogleSignInButtonProps = {
  returnTo?: string;
  onSignedIn?: () => void;
};

export function GoogleSignInButton(props: GoogleSignInButtonProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return null;
  return <ConfiguredGoogleSignInButton {...props} clientId={clientId} />;
}

function ConfiguredGoogleSignInButton({
  clientId, returnTo, onSignedIn,
}: GoogleSignInButtonProps & { clientId: string }) {
  const locale = useLocale();
  const t = useTranslations("auth.google");
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef(false);
  const [error, setError] = useState<"error" | "notStudent" | "unavailable" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const signIn = useEffectEvent(async ({ credential }: GoogleCredentialResponse) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const result = await studentApiFetch<{ is_new_user: boolean }>("/api/student/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });
      notifyStudentSessionChanged("login");
      onSignedIn?.();
      // A modal owns the existing-user flow; page forms use the default redirect.
      if (result.is_new_user) router.replace("/onboarding");
      else if (returnTo || !onSignedIn) router.replace(returnTo || "/onboarding");
    } catch (cause) {
      setError(cause instanceof StudentApiError && cause.status === 403 ? "notStudent" : "error");
    } finally {
      pendingRef.current = false;
      setSubmitting(false);
    }
  });

  useEffect(() => {
    let active = true;
    const element = buttonRef.current;
    loadGoogleIdentity().then((identity) => {
      if (!active || !element) return;
      identity.initialize({
        client_id: clientId,
        ux_mode: "popup",
        callback: (response) => { if (active) void signIn(response); },
      });
      identity.renderButton(element, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        locale,
        width: Math.min(element.clientWidth || 320, 400),
      });
    }).catch(() => { if (active) setError("unavailable"); });
    return () => {
      active = false;
      element?.replaceChildren();
    };
  }, [clientId, locale]);

  return (
    <div className="mb-5 space-y-4">
      <div
        ref={buttonRef}
        aria-busy={submitting}
        className={`flex min-h-10 w-full justify-center ${submitting ? "pointer-events-none opacity-70" : ""}`}
      />
      {error && <p role="alert" className="text-start text-sm text-red-700 dark:text-red-300">{t(error)}</p>}
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span aria-hidden="true" className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span>{t("divider")}</span>
        <span aria-hidden="true" className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
