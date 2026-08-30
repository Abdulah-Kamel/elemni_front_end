import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "404 | Elemni",
  description: "The requested page could not be found.",
};

export default function GlobalNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
        <main className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-md space-y-4 text-center">
            <p className="text-sm font-bold text-primary">404</p>
            <h1 className="text-3xl font-black">الصفحة غير موجودة</h1>
            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
              الرابط المطلوب غير متاح حالياً أو تم نقله.
            </p>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              العودة للرئيسية
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
