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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var v=localStorage.getItem('elemni-dark-mode');if(v==='true'){document.documentElement.classList.add('dark')}else if(v==='false'){document.documentElement.classList.remove('dark')}}catch(e){}})();",
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
