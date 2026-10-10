import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import ar from "@/src/messages/ar.json";
import en from "@/src/messages/en.json";
import { ResetPasswordForm } from "./password-recovery-form";

vi.mock("@/src/i18n/navigation", () => ({
  Link: (props: React.ComponentPropsWithoutRef<"a">) => <a {...props} />,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ResetPasswordForm", () => {
  it.each([
    { locale: "ar", messages: ar, origin: undefined, label: "معلّم؟ ادخل على لوحة تحكم المعلم", href: "https://elemni-dashboard.vercel.app/ar/sign-in" },
    { locale: "en", messages: en, origin: "https://teachers.example.com/", label: "Teacher? Sign in to the teacher dashboard", href: "https://teachers.example.com/en/sign-in" },
  ])("offers a localized teacher sign-in after resetting the password ($locale)", async ({ locale, messages, origin, label, href }) => {
    vi.stubEnv("NEXT_PUBLIC_TEACHER_DASHBOARD_URL", origin);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    render(<NextIntlClientProvider locale={locale} messages={messages}><ResetPasswordForm token="invite-token" /></NextIntlClientProvider>);
    expect(screen.queryByRole("link", { name: label })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(messages.passwordRecovery.newPasswordLabel), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(messages.passwordRecovery.confirmPassword), { target: { value: "password123" } });
    fireEvent.submit(screen.getByRole("button", { name: messages.passwordRecovery.savePassword }).closest("form")!);
    expect(await screen.findByRole("link", { name: label })).toHaveAttribute("href", href);
    expect(screen.getByRole("link", { name: messages.passwordRecovery.login })).toHaveAttribute("href", "/login");
  });
});
