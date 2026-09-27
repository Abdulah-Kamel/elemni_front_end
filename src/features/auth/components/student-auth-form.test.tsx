import { render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import StudentAuthForm from "./student-auth-form";
import { NextIntlClientProvider } from "next-intl";

const messages = { studentAuth: { errorPasswordMismatch: "كلمتا المرور غير متطابقتين.", errorInvalidCredentials: "خطأ", errorStudentOnly: "خطأ", errorRequired: "خطأ", errorUnavailable: "خطأ", errorAlreadyRegistered: "خطأ", errorInvalidData: "خطأ", errorGeneric: "خطأ", registerTitle: "إنشاء حساب جديد", loginTitle: "أهلاً بيك من تاني", registerSubtitle: "ابدأ رحلتك التعليمية في أقل من دقيقة", loginSubtitle: "سجّل دخولك وكمّل مذاكرتك من حيث توقفت", name: "الاسم بالكامل", namePlaceholder: "اكتب اسمك بالكامل", email: "البريد الإلكتروني", phone: "رقم الموبايل", password: "كلمة المرور", passwordHint: "8 أحرف على الأقل", showPassword: "إظهار كلمة المرور", hidePassword: "إخفاء كلمة المرور", confirmPassword: "تأكيد كلمة المرور", forgotPassword: "نسيت كلمة المرور؟", submitting: "جاري المتابعة...", registerAction: "إنشاء الحساب", loginAction: "تسجيل الدخول", terms: "بإنشاء حساب، أنت توافق على الشروط وسياسة الخصوصية.", hasAccount: "عندك حساب بالفعل؟ ", noAccount: "مش عندك حساب؟ ", createAccount: "إنشاء حساب جديد" } };
const wrapped = (children: React.ReactNode) => <NextIntlClientProvider locale="ar" messages={messages}>{children}</NextIntlClientProvider>;

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<"a"> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({ replace: vi.fn() }),
}));

describe("StudentAuthForm", () => {
  it("renders the register submit button disabled in server HTML until hydration completes", () => {
    const markup = renderToStaticMarkup(wrapped(<StudentAuthForm mode="register" />));
    const document = new DOMParser().parseFromString(markup, "text/html");
    const submitButton = document.querySelector('button[type="submit"]');

    expect(submitButton).not.toBeNull();
    expect(submitButton?.hasAttribute("disabled")).toBe(true);
  });

  it("enables the register submit button after the client hydrates", async () => {
    render(wrapped(<StudentAuthForm mode="register" />));

    const submitButton = screen.getByRole("button", { name: "إنشاء الحساب" });

    await waitFor(() => expect(submitButton).toBeEnabled());
  });
});
