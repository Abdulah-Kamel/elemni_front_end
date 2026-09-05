import type { ReactNode } from "react";
import { Readex_Pro } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const readexPro = Readex_Pro({
  subsets: ["arabic", "latin"],
  variable: "--font-readex-pro",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = (await headers()).get("X-NEXT-INTL-LOCALE") ?? "ar";

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      className={readexPro.variable}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
