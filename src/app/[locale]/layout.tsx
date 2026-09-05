import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/src/i18n/routing";
import StudentQueryProvider from "@/src/components/providers/student-query-provider";
import { HtmlLangDir } from "./html-lang-dir";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <StudentQueryProvider>
      <NextIntlClientProvider messages={messages}>
        <HtmlLangDir locale={locale} />
        <div
          lang={locale}
          dir={locale === "ar" ? "rtl" : "ltr"}
          className="font-[family-name:var(--font-readex-pro)]"
        >
          {children}
        </div>
      </NextIntlClientProvider>
    </StudentQueryProvider>
  );
}
