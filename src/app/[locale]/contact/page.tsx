import { getTranslations } from "next-intl/server";
import { Phone, Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/src/features/contact/components/contact-form";

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 text-lg text-gray-600">{t("subtitle")}</p>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {t("info.phone")}
                </h3>
                <p className="mt-1 text-base text-gray-600" dir="ltr">
                  01098324898
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {t("info.email")}
                </h3>
                <p className="mt-1 text-base text-gray-600">
                  support@elemni.com
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {t("info.address")}
                </h3>
                <p className="mt-1 text-base text-gray-600">
                  Menoufia, Egypt
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  );
}
