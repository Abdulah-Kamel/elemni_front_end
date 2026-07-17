import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";

export default async function StudentFooter() {
  const tBrand = await getTranslations("brand");
  const tFooter = await getTranslations("studentLanding.footer");

  return (
    <footer className="border-t border-brand-200 bg-brand-100/60 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center md:text-start">
            <p className="text-base font-bold text-ink">{tBrand("name")}</p>
            <p className="text-[11px] text-muted">{tFooter("copyright")}</p>
          </div>
          <nav className="flex gap-5 text-xs text-muted">
            <Link href="/about" className="hover:text-brand-600 transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-brand-600 transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-brand-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-brand-600 transition-colors">Terms of Service</Link>
            <Link href="/help" className="hover:text-brand-600 transition-colors">Help Center</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
