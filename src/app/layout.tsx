import type { ReactNode } from "react";
import { Cairo, Inter } from "next/font/google";
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      suppressHydrationWarning
      className={`${cairo.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
