import type { ReactNode } from "react";
import { Cairo, Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
  weight: ["400", "600", "700", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = (await headers()).get("X-NEXT-INTL-LOCALE") ?? "ar";

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={`${cairo.variable} ${inter.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
