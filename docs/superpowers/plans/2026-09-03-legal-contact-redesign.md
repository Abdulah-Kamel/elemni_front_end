# Legal & Contact Pages Redesign Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add navbar/footer to legal and contact pages, redesign with better visual design, and use accordions for terms sections.

**Architecture:** Create a shared chrome wrapper (like `AuthChrome`) for legal/contact pages. Redesign pages with accordions for terms, better typography, and visual hierarchy.

**Tech Stack:** Next.js 16, React 19, next-intl, Tailwind CSS v4, motion/react

## Global Constraints

- All text through `next-intl` translations — no hardcoded strings
- Server Components by default — `"use client"` only for interactivity
- RTL (Arabic) is default — use logical CSS properties (ms/me/ps/pe)
- Follow existing codebase patterns (AuthChrome pattern)
- Use existing accordion patterns from codebase (motion/react)

---

## File Structure

```
src/
├── app/[locale]/
│   ├── legal/
│   │   └── page.tsx              # Redesigned legal page
│   └── contact/
│       └── page.tsx              # Redesigned contact page
├── features/
│   └── legal/
│       └── components/
│           └── legal-chrome.tsx  # Shared chrome wrapper (Client Component)
│           └── terms-accordion.tsx  # Accordion for terms sections
│           └── refund-section.tsx   # Accordion for refund policy
└── messages/
    ├── ar.json                   # No changes needed
    └── en.json                   # No changes needed
```

---

### Task 1: Create Legal Chrome Wrapper

**Files:**
- Create: `src/features/legal/components/legal-chrome.tsx`

**Interfaces:**
- Consumes: Navbar, Footer, MotionProvider
- Produces: `LegalChrome` wrapper component

**Step 1: Create the legal feature directory**

```bash
mkdir -p /home/abdullahkm/projects/Elemni/elemni_front_end/src/features/legal/components
```

**Step 2: Create `src/features/legal/components/legal-chrome.tsx`**

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MotionProvider } from "@/src/components/ui/motion-provider";
import Navbar from "@/src/features/landing/components/client/navbar";
import Footer from "@/src/features/landing/components/server/footer";

export default function LegalChrome({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const homeHref = locale === "ar" ? "/" : `/${locale}`;

  useEffect(() => {
    if (localStorage.getItem("elemni-dark-mode") === "true") {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("elemni-dark-mode", String(isDarkMode));
  }, [isDarkMode]);

  return (
    <MotionProvider>
      <div dir="rtl" className="min-h-screen bg-[#F9F8FC] font-cairo text-[#1B1B24] dark:bg-[#0B132B]">
        <Navbar
          onOpenAuth={() => undefined}
          onSearchChange={() => undefined}
          searchQuery=""
          showSearch={false}
          landingBaseHref={homeHref}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode((current) => !current)}
        />
        <main className="pt-24 pb-16">
          {children}
        </main>
        <Footer homeHref={homeHref} />
      </div>
    </MotionProvider>
  );
}
```

**Step 3: Verify component compiles**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npx tsc --noEmit src/features/legal/components/legal-chrome.tsx`

Expected: No errors

**Step 4: Commit**

```bash
git add src/features/legal/components/legal-chrome.tsx
git commit -m "feat: add legal chrome wrapper with navbar and footer"
```

---

### Task 2: Create Terms Accordion Component

**Files:**
- Create: `src/features/legal/components/terms-accordion.tsx`

**Interfaces:**
- Consumes: `legal` translation namespace, motion/react
- Produces: `TermsAccordion` component

**Step 1: Create `src/features/legal/components/terms-accordion.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

const TERMS_SECTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function TermsAccordion() {
  const t = useTranslations("legal.terms");
  const [expandedId, setExpandedId] = useState<number | null>(1);
  const reduce = useReducedMotion();

  function toggle(id: number) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <div className="space-y-3">
      {TERMS_SECTIONS.map((i) => {
        const isOpen = expandedId === i;
        return (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-800"
          >
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-expanded={isOpen}
              aria-controls={`terms-section-${i}`}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
              <span className="text-base font-semibold text-slate-900 dark:text-white">
                {t(`sections.${i}.heading`)}
              </span>
              <motion.span
                animate={reduce ? { rotate: isOpen ? 180 : 0 } : { rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0"
              >
                <ChevronDown className="h-5 w-5 text-slate-500" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`terms-section-${i}`}
                  role="region"
                  aria-labelledby={`terms-heading-${i}`}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                    {t(`sections.${i}.content`)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
```

**Step 2: Verify component compiles**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npx tsc --noEmit src/features/legal/components/terms-accordion.tsx`

Expected: No errors

**Step 3: Commit**

```bash
git add src/features/legal/components/terms-accordion.tsx
git commit -m "feat: add terms accordion component"
```

---

### Task 3: Create Refund Section Component

**Files:**
- Create: `src/features/legal/components/refund-section.tsx`

**Interfaces:**
- Consumes: `legal` translation namespace, motion/react
- Produces: `RefundSection` component

**Step 1: Create `src/features/legal/components/refund-section.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";

type SectionKey = "eligibility" | "nonRefundable" | "process";

const REFUND_SECTIONS: SectionKey[] = ["eligibility", "nonRefundable", "process"];

export function RefundSection() {
  const t = useTranslations("legal.refund");
  const [expandedId, setExpandedId] = useState<SectionKey | null>("eligibility");
  const reduce = useReducedMotion();

  function toggle(id: SectionKey) {
    setExpandedId(expandedId === id ? null : id);
  }

  return (
    <div className="space-y-3">
      <p className="text-base text-slate-600 dark:text-slate-300 mb-4">
        {t("intro")}
      </p>
      {REFUND_SECTIONS.map((key) => {
        const isOpen = expandedId === key;
        return (
          <div
            key={key}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-700 dark:bg-slate-800"
          >
            <button
              type="button"
              onClick={() => toggle(key)}
              aria-expanded={isOpen}
              aria-controls={`refund-section-${key}`}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
            >
              <span className="text-base font-semibold text-slate-900 dark:text-white">
                {t(`${key}.title`)}
              </span>
              <motion.span
                animate={reduce ? { rotate: isOpen ? 180 : 0 } : { rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0"
              >
                <ChevronDown className="h-5 w-5 text-slate-500" />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`refund-section-${key}`}
                  role="region"
                  aria-labelledby={`refund-heading-${key}`}
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5">
                    {key === "process" ? (
                      <ol className="list-decimal list-inside space-y-2 text-base text-slate-600 dark:text-slate-300">
                        {([0, 1, 2, 3] as const).map((i) => (
                          <li key={i}>{t(`${key}.steps.${i}`)}</li>
                        ))}
                      </ol>
                    ) : (
                      <ul className="list-disc list-inside space-y-2 text-base text-slate-600 dark:text-slate-300">
                        {([0, 1, 2] as const).map((i) => (
                          <li key={i}>{t(`${key}.items.${i}`)}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
        {t("contact")}
      </p>
    </div>
  );
}
```

**Step 2: Verify component compiles**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npx tsc --noEmit src/features/legal/components/refund-section.tsx`

Expected: No errors

**Step 3: Commit**

```bash
git add src/features/legal/components/refund-section.tsx
git commit -m "feat: add refund section component with accordions"
```

---

### Task 4: Redesign Legal Page

**Files:**
- Modify: `src/app/[locale]/legal/page.tsx`

**Interfaces:**
- Consumes: LegalChrome, TermsAccordion, RefundSection
- Produces: Redesigned `/legal` route

**Step 1: Create new `src/app/[locale]/legal/page.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import LegalChrome from "@/src/features/legal/components/legal-chrome";
import { TermsAccordion } from "@/src/features/legal/components/terms-accordion";
import { RefundSection } from "@/src/features/legal/components/refund-section";

export default async function LegalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("legal");

  return (
    <LegalChrome locale={locale}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            {t("refund.intro")}
          </p>
        </div>

        {/* Terms & Conditions */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-6 dark:text-white">
            {t("terms.title")}
          </h2>
          <TermsAccordion />
        </section>

        {/* Refund Policy */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-6 dark:text-white">
            {t("refund.title")}
          </h2>
          <RefundSection />
        </section>
      </div>
    </LegalChrome>
  );
}
```

**Step 2: Verify page renders**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npm run build 2>&1 | grep -E "(legal|error|Error)"`

Expected: No errors

**Step 3: Commit**

```bash
git add src/app/[locale]/legal/page.tsx
git commit -m "feat: redesign legal page with accordions and navbar/footer"
```

---

### Task 5: Redesign Contact Page

**Files:**
- Modify: `src/app/[locale]/contact/page.tsx`

**Interfaces:**
- Consumes: LegalChrome, ContactForm
- Produces: Redesigned `/contact` route

**Step 1: Create new `src/app/[locale]/contact/page.tsx`**

```tsx
import { getTranslations } from "next-intl/server";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import LegalChrome from "@/src/features/legal/components/legal-chrome";
import { ContactForm } from "@/src/features/contact/components/contact-form";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("contact");

  return (
    <LegalChrome locale={locale}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-5">
          {/* Contact Info Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t("info.phone")}
                  </h3>
                  <p className="mt-1 text-base text-slate-600 dark:text-slate-300" dir="ltr">
                    01098324898
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t("info.email")}
                  </h3>
                  <p className="mt-1 text-base text-slate-600 dark:text-slate-300" dir="ltr">
                    support@elemni.com
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t("info.address")}
                  </h3>
                  <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
                    Menoufia, Egypt
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t("info.hours")}
                  </h3>
                  <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
                    {t("info.hoursValue")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </LegalChrome>
  );
}
```

**Step 2: Add hours translation to i18n**

Add to `src/messages/en.json` under `contact.info`:

```json
"hours": "Working Hours",
"hoursValue": "Sun - Thu, 9:00 AM - 5:00 PM"
```

Add to `src/messages/ar.json` under `contact.info`:

```json
"hours": "ساعات العمل",
"hoursValue": "الأحد - الخميس، 9:00 صباحًا - 5:00 مساءً"
```

**Step 3: Verify page renders**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npm run build 2>&1 | grep -E "(contact|error|Error)"`

Expected: No errors

**Step 4: Commit**

```bash
git add src/app/[locale]/contact/page.tsx src/messages/en.json src/messages/ar.json
git commit -m "feat: redesign contact page with cards and navbar/footer"
```

---

### Task 6: Final Verification

**Step 1: Run full build**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npm run build`

Expected: Build succeeds with no errors

**Step 2: Run typecheck**

Run: `cd /home/abdullahkm/projects/Elemni/elemni_front_end && npx tsc --noEmit`

Expected: No type errors

**Step 3: Manual verification**

1. Start dev server: `npm run dev`
2. Visit `/ar/legal` — verify navbar, footer, accordions work
3. Visit `/en/legal` — verify navbar, footer, accordions work
4. Visit `/ar/contact` — verify navbar, footer, contact cards
5. Visit `/en/contact` — verify navbar, footer, contact cards
6. Test accordion expand/collapse on legal page
7. Test form validation on contact page
8. Switch language — verify Arabic/English toggle works
9. Check RTL — verify Arabic pages render right-to-left
10. Test dark mode toggle in navbar

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete legal and contact page redesign"
```
