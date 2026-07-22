import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/src/i18n/routing";
import { HtmlLangDir } from "./html-lang-dir";

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
    <NextIntlClientProvider messages={messages}>
      <HtmlLangDir locale={locale} />
      <div
        className={
          locale === "ar"
            ? "font-[family-name:var(--font-cairo)]"
            : "font-[family-name:var(--font-inter)]"
        }
      >
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
