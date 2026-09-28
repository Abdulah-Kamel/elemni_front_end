import type { ReactNode } from "react";
import { Readex_Pro } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/src/i18n/routing";
import StudentQueryProvider from "@/src/components/providers/student-query-provider";
import { ThemeSync } from "./theme-sync";
import "../globals.css";

const readexPro = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-readex-pro",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Applies the saved dark-mode choice before first paint.
const themeScript =
  "(function(){try{var v=localStorage.getItem('elemni-dark-mode');if(v==='true'){document.documentElement.classList.add('dark')}else if(v==='false'){document.documentElement.classList.remove('dark')}}catch(e){}})();";

export const revalidate = 300;

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
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} suppressHydrationWarning className={readexPro.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning className="font-[family-name:var(--font-readex-pro)]">
        <ThemeSync locale={locale} />
        <StudentQueryProvider>
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </StudentQueryProvider>
      </body>
    </html>
  );
}
