# Legal & Contact Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create localized legal and contact pages required for payment gateway approval.

**Architecture:** Two new routes (`/legal`, `/contact`) using Server Components with i18n translations, plus footer updates to link to them.

**Tech Stack:** Next.js 16, React 19, next-intl, Tailwind CSS v4, lucide-react

## Global Constraints

- All text through `next-intl` translations — no hardcoded strings
- Server Components by default — `"use client"` only for form interactivity
- RTL (Arabic) is default — use logical CSS properties (ms/me/ps/pe)
- Follow existing codebase patterns
- Refund window: 14 days
- Contact: Phone `01098324898`, Email `support@elemni.com`, Address `Menoufia, Egypt`

---

## File Structure

```
src/
├── app/[locale]/
│   ├── legal/
│   │   └── page.tsx              # Legal page (Server Component)
│   └── contact/
│       └── page.tsx              # Contact page (Server Component)
├── features/contact/
│   └── components/
│       └── contact-form.tsx      # Contact form (Client Component)
├── messages/
│   ├── ar.json                   # Add legal & contact translations
│   └── en.json                   # Add legal & contact translations
└── features/
    ├── landing/components/server/
    │   └── footer.tsx            # Update links
    └── marketing/components/
        └── footer.tsx            # Update links
```

---

### Task 1: Add i18n Translations

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/ar.json`

**Interfaces:**
- Produces: `legal`, `contact` translation namespaces

**Step 1: Add English translations to `src/messages/en.json`**

Add before the closing `}`:

```json
"legal": {
  "title": "Terms & Conditions",
  "refund": {
    "title": "Refund & Cancellation Policy",
    "intro": "We want you to be satisfied with your purchase. If you're not, we're here to help.",
    "eligibility": {
      "title": "Eligibility for Refund",
      "items": [
        "You may request a refund within 14 days of your purchase date.",
        "The course must not have been more than 30% completed.",
        "Refund requests must be submitted through our contact page or via email."
      ]
    },
    "nonRefundable": {
      "title": "Non-Refundable Items",
      "items": [
        "Courses completed more than 30%",
        "Courses purchased more than 14 days ago",
        "Bundles or promotional packages",
        "Courses purchased with discount codes (unless defective)"
      ]
    },
    "process": {
      "title": "How to Request a Refund",
      "steps": [
        "Contact us via the contact page or email support@elemni.com",
        "Provide your order number and reason for the refund",
        "We will review your request within 3 business days",
        "If approved, the refund will be processed to your original payment method within 5-10 business days"
      ]
    },
    "contact": "For any refund inquiries, please contact us at support@elemni.com"
  },
  "terms": {
    "title": "Terms & Conditions",
    "sections": [
      {
        "heading": "1. Acceptance of Terms",
        "content": "By accessing and using Elemni (the \"Platform\"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the Platform."
      },
      {
        "heading": "2. User Registration",
        "content": "You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials."
      },
      {
        "heading": "3. Course Enrollment & Access",
        "content": "Upon successful payment, you receive a non-transferable license to access the enrolled course content. Access is personal and cannot be shared or transferred."
      },
      {
        "heading": "4. Payment & Pricing",
        "content": "All prices are displayed in Egyptian Pounds (EGP). We reserve the right to change pricing at any time. Existing enrollments are not affected by price changes."
      },
      {
        "heading": "5. Intellectual Property",
        "content": "All course content, videos, materials, and the Platform itself are the intellectual property of Elemni and its instructors. Unauthorized reproduction or distribution is prohibited."
      },
      {
        "heading": "6. User Conduct",
        "content": "You agree not to: share account credentials, record or download course content, use the Platform for illegal purposes, or attempt to bypass security measures."
      },
      {
        "heading": "7. Limitation of Liability",
        "content": "Elemni shall not be liable for any indirect, incidental, or consequential damages. Our total liability shall not exceed the amount you paid for the course."
      },
      {
        "heading": "8. Governing Law",
        "content": "These Terms are governed by the laws of the Arab Republic of Egypt. Any disputes shall be resolved in the courts of Cairo, Egypt."
      }
    ]
  }
},
"contact": {
  "title": "Contact Us",
  "subtitle": "Have a question? We'd love to hear from you.",
  "info": {
    "phone": "Phone",
    "email": "Email",
    "address": "Address"
  },
  "form": {
    "name": "Your Name",
    "namePlaceholder": "Enter your name",
    "email": "Email Address",
    "emailPlaceholder": "Enter your email",
    "message": "Message",
    "messagePlaceholder": "How can we help you?",
    "submit": "Send Message",
    "sending": "Sending...",
    "success": "Message sent successfully! We'll get back to you soon.",
    "error": "Something went wrong. Please try again later."
  }
}
```

**Step 2: Add Arabic translations to `src/messages/ar.json`**

Add before the closing `}`:

```json
"legal": {
  "title": "الشروط والأحكام",
  "refund": {
    "title": "سياسة الاسترداد والإلغاء",
    "intro": "نريد أن تكون راضيًا عن عملية الشراء. إذا لم تكن راضيًا، نحن هنا لمساعدتك.",
    "eligibility": {
      "title": "الأهلية للاسترداد",
      "items": [
        "يمكنك طلب استرداد المبلغ خلال 14 يومًا من تاريخ الشراء.",
        "يجب ألا يكون الكورس قد تم إكمال أكثر من 30% منه.",
        "يجب تقديم طلب الاسترداد من خلال صفحة الاتصال أو عبر البريد الإلكتروني."
      ]
    },
    "nonRefundable": {
      "title": "العناصر غير القابلة للاسترداد",
      "items": [
        "الkorssات التي تم إكمالها أكثر من 30%",
        "الkorssات التي تم شراؤها منذ أكثر من 14 يومًا",
        "الحزم أو الباقات الترويجية",
        "الkorssات المشتراة بأكواد الخصم (إلا إذا كانت معيبة)"
      ]
    },
    "process": {
      "title": "كيفية طلب الاسترداد",
      "steps": [
        "تواصل معنا من خلال صفحة الاتصال أو عبر البريد الإلكتروني support@elemni.com",
        "provide رقم طلبك وسبب طلب الاسترداد",
        "سنراجع طلبك خلال 3 أيام عمل",
        "إذا تمت الموافقة، سيتم الاسترداد إلى طريقة الدفع الأصلية خلال 5-10 أيام عمل"
      ]
    },
    "contact": "لاستفسارات الاسترداد، يرجى التواصل معنا عبر support@elemni.com"
  },
  "terms": {
    "title": "الشروط والأحكام",
    "sections": [
      {
        "heading": "1. قبول الشروط",
        "content": "باستخدامك لمنصة علمني (\"المنصة\")، أنت توافق على الالتزام بهذه الشروط والأحكام. إذا لم توافق، يرجى عدم استخدام المنصة."
      },
      {
        "heading": "2. تسجيل المستخدم",
        "content": "يجب عليك تقديم معلومات دقيقة وكاملة عند إنشاء حساب. أنت مسؤول عن الحفاظ على سرية بيانات اعتماد حسابك."
      },
      {
        "heading": "3. التسجيل في الكورس والوصول",
        "content": "بعد الدفع بنجاح، تتلقى ترخيصًا غير قابل للتحويل للوصول إلى محتوى الكورس المسجل فيه. الوصول شخصي ولا يمكن مشاركته أو نقله."
      },
      {
        "heading": "4. الدفع والأسعار",
        "content": "جميع الأسعار معروضة بالجنيه المصري (ج.م). نحتفظ بحق تغيير الأسعار في أي وقت. لا تتأثر الكورسات المسجلة بها تغييرات الأسعار."
      },
      {
        "heading": "5. الملكية الفكرية",
        "content": "جميع محتويات الكورسات والvideos والمواد والمنصة نفسها هي ملكية فكرية لمنصة علمني ومدرسيها. يُحظر الت reproducing أو التوزيع غير المصرح به."
      },
      {
        "heading": "6. سلوك المستخدم",
        "content": "أنت توافق على عدم: مشاركة بيانات اعتماد الحساب، أو تسجيل أو تنزيل محتوى الكورس، أو استخدام المنصة لأغراض غير قانونية، أو محاولة تجاوز تدابير الأمان."
      },
      {
        "heading": "7. تحديد المسؤولية",
        "content": "لن تتحمل منصة علمني المسؤولية عن أي أضرار غير مباشرة أو عرضية أو تبعية. لا تتجاوز مسؤوليتنا الإجمالية المبلغ الذي دفعته للكورس."
      },
      {
        "heading": "8. القانون الحاكم",
        "content": "هذه الشروط خاضعة لقوانين جمهورية مصر العربية. تُحل أي نزاعات في محاكم القاهرة، مصر."
      }
    ]
  }
},
"contact": {
  "title": "اتصل بنا",
  "subtitle": "هل لديك سؤال؟ يسعدنا سماعك.",
  "info": {
    "phone": "الهاتف",
    "email": "البريد الإلكتروني",
    "address": "العنوان"
  },
  "form": {
    "name": "اسمك",
    "namePlaceholder": "أدخل اسمك",
    "email": "البريد الإلكتروني",
    "emailPlaceholder": "أدخل بريدك الإلكتروني",
    "message": "الرسالة",
    "messagePlaceholder": "كيف يمكننا مساعدتك؟",
    "submit": "إرسال الرسالة",
    "sending": "جاري الإرسال...",
    "success": "تم إرسال الرسالة بنجاح! سنتواصل معك قريبًا.",
    "error": "حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقًا."
  }
}
```

**Step 3: Verify translations are valid JSON**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && node -e "JSON.parse(require('fs').readFileSync('src/messages/en.json','utf8')); console.log('en.json OK')" && node -e "JSON.parse(require('fs').readFileSync('src/messages/ar.json','utf8')); console.log('ar.json OK')"`

Expected: Both print "OK"

**Step 4: Commit**

```bash
git add src/messages/en.json src/messages/ar.json
git commit -m "feat(i18n): add legal and contact page translations"
```

---

### Task 2: Create Legal Page

**Files:**
- Create: `src/app/[locale]/legal/page.tsx`

**Interfaces:**
- Consumes: `legal` translation namespace
- Produces: `/legal` route

**Step 1: Create the legal page directory**

```bash
mkdir -p /home/abdullahkm/projects/Elemni/elemni_front_end/src/app/[locale]/legal
```

**Step 2: Create `src/app/[locale]/legal/page.tsx`**

```tsx
import { getTranslations } from "next-intl/server";

export default async function LegalPage() {
  const t = await getTranslations("legal");

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {t("title")}
        </h1>

        {/* Terms & Conditions */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("terms.title")}
          </h2>
          <div className="mt-6 space-y-6">
            {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((i) => (
              <div key={i}>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t(`terms.sections.${i}.heading`)}
                </h3>
                <p className="mt-2 text-base text-gray-600 leading-relaxed">
                  {t(`terms.sections.${i}.content`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Refund Policy */}
        <section className="mt-16 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-bold text-gray-900">
            {t("refund.title")}
          </h2>
          <p className="mt-4 text-base text-gray-600 leading-relaxed">
            {t("refund.intro")}
          </p>

          {/* Eligibility */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("refund.eligibility.title")}
            </h3>
            <ul className="mt-3 list-disc list-inside space-y-2 text-base text-gray-600">
              {([0, 1, 2] as const).map((i) => (
                <li key={i}>{t(`refund.eligibility.items.${i}`)}</li>
              ))}
            </ul>
          </div>

          {/* Non-Refundable */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("refund.nonRefundable.title")}
            </h3>
            <ul className="mt-3 list-disc list-inside space-y-2 text-base text-gray-600">
              {([0, 1, 2, 3] as const).map((i) => (
                <li key={i}>{t(`refund.nonRefundable.items.${i}`)}</li>
              ))}
            </ul>
          </div>

          {/* Process */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("refund.process.title")}
            </h3>
            <ol className="mt-3 list-decimal list-inside space-y-2 text-base text-gray-600">
              {([0, 1, 2, 3] as const).map((i) => (
                <li key={i}>{t(`refund.process.steps.${i}`)}</li>
              ))}
            </ol>
          </div>

          {/* Contact */}
          <p className="mt-8 text-base text-gray-600">
            {t("refund.contact")}
          </p>
        </section>
      </div>
    </main>
  );
}
```

**Step 3: Verify page renders**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npm run build 2>&1 | grep -E "(legal|error|Error)"`

Expected: No errors related to legal page

**Step 4: Commit**

```bash
git add src/app/[locale]/legal/page.tsx
git commit -m "feat: add legal page with terms and refund policy"
```

---

### Task 3: Create Contact Form Component

**Files:**
- Create: `src/features/contact/components/contact-form.tsx`

**Interfaces:**
- Consumes: `contact` translation namespace
- Produces: `ContactForm` component

**Step 1: Create the contact feature directory**

```bash
mkdir -p /home/abdullahkm/projects/Elemni/elemni_front_end/src/features/contact/components
```

**Step 2: Create `src/features/contact/components/contact-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    // Placeholder - backend will be added later
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setStatus("success");
    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          {t("name")}
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          placeholder={t("namePlaceholder")}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          {t("email")}
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder={t("emailPlaceholder")}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-700"
        >
          {t("message")}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder={t("messagePlaceholder")}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-4 h-4" />
        {isSubmitting ? t("sending") : t("submit")}
      </button>

      {status === "success" && (
        <p className="text-sm text-green-600">{t("success")}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">{t("error")}</p>
      )}
    </form>
  );
}
```

**Step 3: Verify component compiles**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npx tsc --noEmit src/features/contact/components/contact-form.tsx`

Expected: No errors

**Step 4: Commit**

```bash
git add src/features/contact/components/contact-form.tsx
git commit -m "feat: add contact form component"
```

---

### Task 4: Create Contact Page

**Files:**
- Create: `src/app/[locale]/contact/page.tsx`

**Interfaces:**
- Consumes: `contact` translation namespace, `ContactForm` component
- Produces: `/contact` route

**Step 1: Create the contact page directory**

```bash
mkdir -p /home/abdullahkm/projects/Elemni/elemni_front_end/src/app/[locale]/contact
```

**Step 2: Create `src/app/[locale]/contact/page.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Phone, Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/features/contact/components/contact-form";

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
```

**Step 3: Verify page renders**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npm run build 2>&1 | grep -E "(contact|error|Error)"`

Expected: No errors related to contact page

**Step 4: Commit**

```bash
git add src/app/[locale]/contact/page.tsx
git commit -m "feat: add contact page with form"
```

---

### Task 5: Update Student Landing Footer

**Files:**
- Modify: `src/features/landing/components/server/footer.tsx`

**Interfaces:**
- Consumes: i18n Link component
- Produces: Updated footer with working links

**Step 1: Import `Link` from `next-intl`**

Add import at top of file:

```tsx
import Link from "next-intl/link";
```

**Step 2: Update privacy link**

Change line 142-144 from:

```tsx
<a href="#" className="hover:text-white transition-colors">
  سياسة الخصوصية والاستخدام
</a>
```

To:

```tsx
<Link href="/legal" className="hover:text-white transition-colors">
  سياسة الخصوصية والاستخدام
</Link>
```

**Step 3: Update contact section**

Change lines 153-166 from hardcoded contact info to link:

```tsx
<div className="space-y-2 text-xs text-slate-400">
  <Link href="/contact" className="flex items-center gap-2 hover:text-white transition-colors">
    <Phone className="w-3.5 h-3.5 text-primary" />
    <span>01098324898</span>
  </Link>
  <Link href="/contact" className="flex items-center gap-2 hover:text-white transition-colors">
    <Mail className="w-3.5 h-3.5 text-primary" />
    <span>support@elemni.com</span>
  </Link>
  <Link href="/contact" className="flex items-center gap-2 hover:text-white transition-colors">
    <MapPin className="w-3.5 h-3.5 text-primary" />
    <span>Menoufia, Egypt</span>
  </Link>
</div>
```

**Step 4: Verify footer renders**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npm run build 2>&1 | grep -E "(footer|error|Error)"`

Expected: No errors

**Step 5: Commit**

```bash
git add src/features/landing/components/server/footer.tsx
git commit -m "feat: update student landing footer with legal/contact links"
```

---

### Task 6: Update Teacher Marketing Footer

**Files:**
- Modify: `src/features/marketing/components/footer.tsx`

**Interfaces:**
- Consumes: i18n Link component
- Produces: Updated footer with working links

**Step 1: Import `Link` from `next-intl`**

Add import at top of file:

```tsx
import Link from "next-intl/link";
```

**Step 2: Update footer links to use `Link` component**

Change lines 18-26 from:

```tsx
<nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
  {FOOTER_LINKS.map((key) => (
    <a
      key={key}
      href="#"
      className="text-sm text-white/60 transition-colors hover:text-white"
    >
      {t(key)}
    </a>
  ))}
</nav>
```

To:

```tsx
<nav className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
  {FOOTER_LINKS.map((key) => (
    <Link
      key={key}
      href={key === "help" ? "#" : `/${key}`}
      className="text-sm text-white/60 transition-colors hover:text-white"
    >
      {t(key)}
    </Link>
  ))}
</nav>
```

Note: `help` link stays as `#` since no help center page exists yet.

**Step 3: Verify footer renders**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npm run build 2>&1 | grep -E "(footer|error|Error)"`

Expected: No errors

**Step 4: Commit**

```bash
git add src/features/marketing/components/footer.tsx
git commit -m "feat: update teacher marketing footer with legal/contact links"
```

---

### Task 7: Final Verification

**Step 1: Run full build**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npm run build`

Expected: Build succeeds with no errors

**Step 2: Run lint**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npm run lint`

Expected: No lint errors

**Step 3: Run typecheck**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npx tsc --noEmit`

Expected: No type errors

**Step 4: Manual verification**

1. Start dev server: `npm run dev`
2. Visit `/ar` — check footer links point to `/ar/legal` and `/ar/contact`
3. Visit `/en` — check footer links point to `/en/legal` and `/en/contact`
4. Visit `/legal` — verify Terms & Conditions and Refund Policy render
5. Visit `/contact` — verify contact info and form render
6. Test form validation — submit empty form, verify errors
7. Test form submission — fill form, submit, verify success message
8. Switch language — verify Arabic/English toggle works on both pages
9. Check RTL — verify Arabic pages render right-to-left

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete legal and contact pages for payment gateway"
```
