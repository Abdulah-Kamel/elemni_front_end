# Implementation Plan — Elemni Landing Page (first feature)

> **Audience:** an implementing agent building this from a fresh Create Next App.
> This document is self-contained. You do **not** need to open the design PNGs —
> all copy, layout, tokens, and file paths are transcribed here. The design
> reference lives in `assets/design/screen1.png … screen6.png` if you want to
> cross-check.
>
> **Read `CLAUDE.md` and `AGENTS.md` first.** The rules there are
> non-negotiable and this plan obeys them. Key ones for this task:
> - Next.js **16.2.10** + React 19. APIs differ from older versions — read
>   `node_modules/next/dist/docs/` before writing framework code.
> - **Server Components by default.** `"use client"` only where you need state
>   or event handlers (the nav mobile menu, the pricing toggle, the FAQ
>   accordion, the language switcher). Everything else is a Server Component.
> - **RTL is the default.** Arabic (`ar`) is the default locale. Use Tailwind
>   **logical properties only** (`ms/me`, `ps/pe`, `start/end`,
>   `text-start/text-end`). Never `ml/mr/pl/pr/left/right`.
> - **No hardcoded user-facing strings.** Every word goes through `next-intl`.
> - This is a **marketing page: static, no auth, no API calls.** All numbers
>   (prices, commission %, stats, the earnings example) are **static display
>   copy that lives in the message files** — do NOT compute them, do NOT build a
>   live calculator, do NOT fetch them. See "Money guardrail" below.

---

## 0. Brand & scope decisions (already made)

- **Brand name:** "Elemni" (EN) / "إلمني" (AR). The design mockups say
  "EduStream / إديو ستريم" — ignore that, it's a placeholder. Put the brand name
  in **one** i18n key (`brand.name`) and reference it everywhere so it is a
  one-line change.
- **Imagery:** use simple **placeholder images** (`next/image` + solid/gradient
  boxes). Do not attempt to rebuild the dashboard/video-player chrome or teacher
  photos in HTML/CSS. Placeholders are specified per section.
- **Locales:** ship both `ar` (default) and `en`. AR copy is transcribed in full
  below; EN copy is provided too. Every section must render correctly in both
  directions.

### Money guardrail (do not violate)
The design shows an "earnings calculator" (`250 × 500 = 125,000`), prices, and
commission percentages. On this marketing page these are **static illustrative
text**, not functionality:
- The earnings figure is a **fixed string** in the message file. Do **not** wire
  the inputs to multiply anything. If you make it interactive, you have created
  client-side money math, which `CLAUDE.md` forbids.
- Prices and commission % are **static content** for now. Fine to hardcode in
  the message file for the marketing page. (In the real product these come from
  the API — out of scope here.)

---

## 1. Foundation setup (do this before any section)

The repo is currently a bare Create Next App (`app/` at root, no `src/`, no
i18n). Establish the target structure from `CLAUDE.md`.

### 1.1 Install dependencies
```bash
npm install next-intl lucide-react clsx tailwind-merge
```
- `next-intl` — i18n. **Verify its App-Router API against the installed
  version** (`node_modules/next-intl`); the skeleton below matches the current
  major but confirm before assuming.
- `lucide-react` — icons (all icons in the design are simple line icons).
- `clsx` + `tailwind-merge` — for a `cn()` class helper.

### 1.2 Move to `src/` layout
1. Move `app/` → `src/app/`.
2. In `tsconfig.json`, change the path alias from `"@/*": ["./*"]` to
   `"@/*": ["./src/*"]`. (Confirm no other file relied on the old root alias.)
3. Keep `public/` at repo root (Next still serves it from there).

### 1.3 Target folder structure (create as you go)
```
src/
  app/
    [locale]/
      (marketing)/
        page.tsx                 # the landing page — composes sections
        layout.tsx               # marketing layout (Header + Footer)
      layout.tsx                 # root html/body, fonts, NextIntlClientProvider
    globals.css                  # Tailwind v4 + @theme design tokens
  features/
    marketing/
      components/                # ALL section components live here
        header.tsx
        hero.tsx
        stats-bar.tsx
        features-grid.tsx
        drm-section.tsx
        curriculum-section.tsx
        video-demo.tsx
        payments-section.tsx
        comparison-table.tsx
        before-after.tsx
        steps-section.tsx
        migration-section.tsx
        testimonials.tsx
        pricing-section.tsx
        pricing-toggle.tsx       # "use client"
        faq-section.tsx          # "use client"
        final-cta.tsx
        footer.tsx
      data.ts                    # non-string sample data (icons, sample cards)
  components/ui/                 # shared primitives
    button.tsx
    badge.tsx
    section.tsx                  # section wrapper (padding, max-width, bg variants)
  i18n/
    routing.ts
    request.ts
    navigation.ts
  lib/
    cn.ts                        # clsx + tailwind-merge helper
  middleware.ts
messages/
  ar.json
  en.json
```
> **No barrel files** (`index.ts` re-exports) — `CLAUDE.md` bans them. Import
> components by their full path.

### 1.4 next-intl wiring (skeleton — verify against installed version)

`src/i18n/routing.ts`
```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
});
```

`src/i18n/navigation.ts`
```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

`src/i18n/request.ts`
```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "ar" | "en")) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

`src/middleware.ts`
```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

`next.config.ts` — wrap with the plugin:
```ts
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const nextConfig: NextConfig = {};
export default withNextIntl(nextConfig);
```

### 1.5 Fonts (`next/font`, per `CLAUDE.md`)
In `src/app/[locale]/layout.tsx`:
```ts
import { Cairo, Inter } from "next/font/google";

const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
```
Apply `--font-cairo` as the body font when `locale === "ar"`, `--font-inter`
when `en`.

### 1.6 Root layout (`src/app/[locale]/layout.tsx`)
- `export function generateStaticParams()` returning `[{locale:"ar"},{locale:"en"}]`.
- Call `setRequestLocale(locale)` (from `next-intl/server`) for static rendering.
- Render:
  ```tsx
  <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}
        className={`${cairo.variable} ${inter.variable}`}>
    <body className={locale === "ar" ? "font-[family-name:var(--font-cairo)]" : "font-[family-name:var(--font-inter)]"}>
      <NextIntlClientProvider>{children}</NextIntlClientProvider>
    </body>
  </html>
  ```
- `NextIntlClientProvider` import from `next-intl`.

### 1.7 `src/lib/cn.ts`
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
```

---

## 2. Design system (Tailwind v4 `@theme` — paste into `globals.css`)

Tailwind v4 is already installed (`@tailwindcss/postcss`). Config is
**CSS-first**. Put this in `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Brand purple */
  --color-brand-50:  #f5f3ff;
  --color-brand-100: #ede9fe;
  --color-brand-200: #ddd6fe;
  --color-brand-300: #c4b5fd;
  --color-brand-400: #a78bfa;
  --color-brand-500: #8b5cf6;
  --color-brand-600: #7c3aed;   /* primary */
  --color-brand-700: #6d28d9;   /* headings */
  --color-brand-900: #2e1065;   /* dark DRM section bg */

  /* Accent amber (CTAs, highlights) */
  --color-accent-400: #fbbf24;
  --color-accent-500: #f59e0b;
  --color-accent-600: #d97706;

  /* Semantic */
  --color-success-500: #10b981;
  --color-danger-500:  #ef4444;
  --color-ink:         #1f2937;
  --color-muted:       #6b7280;

  --radius-card: 1.5rem;   /* rounded-3xl-ish cards */
}

/* Reusable gradient utilities */
@layer utilities {
  .bg-hero-gradient   { background-image: linear-gradient(135deg,#7c3aed 0%,#a855f7 55%,#c026d3 100%); }
  .bg-cta-gradient    { background-image: linear-gradient(120deg,#7c3aed 0%,#c026d3 100%); }
  .shadow-soft        { box-shadow: 0 20px 50px -20px rgba(124,58,237,0.25); }
}
```

### Visual language (apply consistently)
- **Cards:** white, `rounded-3xl`, `shadow-soft`, generous padding (`p-6`/`p-8`).
- **Buttons/CTAs:** pill shaped (`rounded-full`), `px-6 py-3`, bold.
  - Primary CTA = **amber** (`bg-accent-500 text-white hover:bg-accent-600`).
  - Secondary CTA = **outline** (`border border-brand-200 text-brand-700`).
  - In-card purple CTA = `bg-brand-600 text-white`.
- **Section backgrounds** alternate: white ↔ `bg-brand-50` (light lavender).
  The DRM section is `bg-brand-900` (dark, white text). Hero + Final CTA use the
  gradient utilities.
- **Headings:** `text-brand-700`, bold, large (`text-3xl md:text-4xl`),
  centered for most sections. Some headlines highlight one word with the accent
  color or an underline (noted per section).
- **Badges/pills:** small rounded-full chips, e.g. amber
  `bg-accent-100 text-accent-600` or brand `bg-brand-100 text-brand-700`.
- **Check/X marks:** `success-500` circle-check / `danger-500` circle-x
  (lucide `CircleCheck` / `CircleX`).
- **Numerals:** Arabic-Indic digits are written **literally in the AR message
  strings** (e.g. `"١٢ مليون"`); EN strings use Latin digits. No runtime number
  formatting is needed for these static values.

### Shared primitives to build first (`src/components/ui/`)
- **`Section`** — wraps a section: `<section>` with `mx-auto max-w-6xl px-4 py-16 md:py-24`, optional `background` prop (`"white" | "lavender" | "dark" | "gradient"`) and centered heading slot.
- **`Button`** — `variant: "primary" | "outline" | "purple"`, `size`, renders `<a>`/`Link`. Pill styling above.
- **`Badge`** — small pill, `tone: "amber" | "brand" | "success"`.

---

## 3. Message files — copy (source of truth)

Create `messages/ar.json` and `messages/en.json` with the **exact keys** below.
Sections reference these namespaces. AR is the real transcribed copy; EN is a
faithful translation. (Answers for FAQ items 2–6 were not legible in the design —
placeholders are marked `TODO`; keep them as real sentences, flag to the team.)

> Because JSON can't be split across code blocks cleanly, build the file with
> these namespaces and key/value pairs. Structure: one top-level object per
> namespace listed here.

### `brand`
| key | ar | en |
|---|---|---|
| `name` | إلمني | Elemni |

### `nav`
| key | ar | en |
|---|---|---|
| `home` | الرئيسية | Home |
| `features` | المميزات | Features |
| `pricing` | الأسعار | Pricing |
| `faq` | الأسئلة الشائعة | FAQ |
| `stories` | قصص نجاح | Success stories |
| `login` | دخول | Log in |
| `cta` | ابدأ مجانًا | Start free |
| `switchLang` | EN | ع |

### `hero`
| key | ar | en |
|---|---|---|
| `badge` | منصة حماية DRM كاملة | Full DRM protection |
| `title` | بطّل تبيع دروسك في جروبات الواتساب | Stop selling your lessons in WhatsApp groups |
| `subtitle` | منصة متكاملة تحمي فيديوهاتك من السرقة وتدير اشتراكات طلابك أوتوماتيكيًا. ركّز في الشرح وسيب الباقي علينا. | An all-in-one platform that protects your videos from theft and manages your students' subscriptions automatically. Focus on teaching, we handle the rest. |
| `ctaPrimary` | ابدأ ملكك مجانًا | Start free |
| `ctaSecondary` | شوف ديمو دقيقتين | Watch a 2-min demo |

### `stats` (each `{value, label}`)
| key | ar value | ar label | en value | en label |
|---|---|---|---|---|
| `earnings` | ١٢ مليون | جنيه أرباح المدرسين | 12M | EGP earned by teachers |
| `students` | ١٨٠,٠٠٠ | طالب نشط شهريًا | 180,000 | monthly active students |
| `teachers` | ٣,٠٠٠+ | مدرس بيثق بنا | 3,000+ | teachers trust us |

### `features` (heading + 6 items `{title, desc}`)
| key | ar | en |
|---|---|---|
| `heading` | مميزات تخلّيك تركز في التدريس.. وسيب الباقي علينا | Features that let you focus on teaching — we handle the rest |
| `exams.title` | امتحانات أوتوماتيك | Automatic exams |
| `exams.desc` | قيّم طلابك وصحّح الأسئلة بضغطة زر. | Grade your students and mark answers in one click. |
| `organize.title` | تنظيم بالمادة والصف | Organized by subject & grade |
| `organize.desc` | سهولة الوصول لكل محاضرة حسب المنهج. | Easy access to every lecture by curriculum. |
| `drm.title` | حماية DRM كاملة | Full DRM protection |
| `drm.desc` | فيديوهاتك متشفّرة ومستحيل تتصوّر أو تتحمّل. | Your videos are encrypted — impossible to record or download. |
| `mobile.title` | من أي موبايل | On any phone |
| `mobile.desc` | تجربة سلسة على الأندرويد والآيفون. | A smooth experience on Android and iPhone. |
| `payments.title` | مدفوعات جاهزة | Payments built in |
| `payments.desc` | الطالب بيدفع ويشترك ويفتح الكورس في ثواني. | Students pay, subscribe, and unlock the course in seconds. |
| `reports.title` | تقارير متابعة الطلاب | Student tracking reports |
| `reports.desc` | اعرف مين اتفرّج، وسمع قد إيه، وحلّ إمتى. | Know who watched, how much, and when they solved. |

### `drmSection` (heading + subtitle + 4 items `{title, desc}` + mockupBadge)
| key | ar | en |
|---|---|---|
| `badge` | حماية المحتوى | Content protection |
| `heading` | حماية كاملة لمحتواك بـ DRM | Full DRM protection for your content |
| `subtitle` | أنسى تسريب الفيديوهات. تقنياتنا بتضمن إن الطالب بس هو اللي يشوفه، وبتقفل أي محاولة للسرقة. | Forget leaked videos. Our tech ensures only your student can watch, and blocks any theft attempt. |
| `encrypted.title` | بث مشفّر | Encrypted streaming |
| `encrypted.desc` | استحالة إن الفيديو يتسجّل أو يتحمّل. | The video can't be recorded or downloaded. |
| `watermark.title` | علامة مائية ديناميكية | Dynamic watermark |
| `watermark.desc` | اسم الطالب ورقمه بيظهروا على الشاشة. | The student's name and number appear on screen. |
| `devices.title` | تحديد الأجهزة | Device limits |
| `devices.desc` | الطالب يفتح من جهاز واحد بس، مفيش مشاركة. | Students open from one device only — no sharing. |
| `instantBan.title` | حظر فوري | Instant ban |
| `instantBan.desc` | حظر أوتوماتيك لأي محاولة تسجيل للشاشة. | Automatic ban on any screen-recording attempt. |
| `mockupBadge` | تسجيل الشاشة متوقف | Screen recording blocked |

> Note: this is **marketing copy only**. Per `CLAUDE.md`, none of these DRM
> claims are enforced by this repo — you are rendering text, not building
> enforcement. Do not add any client-side "device check" or watermark overlay.

### `curriculum` (heading + subtitle + filter labels + CTA)
| key | ar | en |
|---|---|---|
| `heading` | مبني على المنهج المصري بالظبط | Built exactly on the Egyptian curriculum |
| `subtitle` | نظام ذكي لدروسك يسهّل على الطالب الوصول للمحتوى بدون تشتت. | A smart system that makes it easy for students to find content without getting lost. |
| `filters.subject` | المادة | Subject |
| `filters.grade` | الصف | Grade |
| `filters.physics` | فيزياء | Physics |
| `filters.chemistry` | كيمياء | Chemistry |
| `filters.thirdSec` | الثالث الثانوي | Grade 12 |
| `filters.secondSec` | الثاني الثانوي | Grade 11 |
| `filters.sciMath` | علمي رياضة | Science–Math |
| `filters.sciBio` | علمي علوم | Science–Bio |
| `cta` | عرض كل الدروس | View all lessons |
| `free` | مجاني | Free |
| `price` | {n} ج.م | EGP {n} |

Sample lesson cards live in `data.ts` (see §5.6) — titles/subtitles that are
user-facing must still come from message keys `curriculum.lessons.*`:
| key | ar | en |
|---|---|---|
| `lessons.light.title` | الضوء والإبصار | Light & Vision |
| `lessons.light.chapter` | الفصل الثاني | Chapter 2 |
| `lessons.light.grade` | الصف الثالث | Grade 12 |
| `lessons.current.title` | التأثير المغناطيسي للتيار | Magnetic effect of current |
| `lessons.current.chapter` | الفصل الأول | Chapter 1 |
| `lessons.current.grade` | الصف الثاني | Grade 11 |
| `lessons.ohm.title` | التيار الكهربي وقانون أوم | Electric current & Ohm's law |
| `lessons.ohm.chapter` | الفصل الأول | Chapter 1 |
| `lessons.ohm.grade` | الصف الأول | Grade 10 |

### `videoDemo`
| key | ar | en |
|---|---|---|
| `heading` | شوفها بنفسك في دقيقتين | See it yourself in two minutes |
| `subtitle` | بضغطة زرار واحدة تقدر ترفع كورس كامل، وتحميه، وتستقبل أرباحك. | With one click you can upload a full course, protect it, and receive your earnings. |
| `pill.upload` | رفع محاضرة | Upload a lecture |
| `pill.organize` | ترتيب المنهج | Organize the curriculum |
| `pill.collect` | استلام الفلوس | Collect payments |

### `payments`
| key | ar | en |
|---|---|---|
| `heading` | انت بتدرّس. واحنا بنجيب الفلوس. | You teach. We collect the money. |
| `subtitle` | تحصيل أرباحك بقى أسهل من أي وقت فات. طرق دفع متعددة تناسب كل طلابك، وتحويل فوري لحسابك البنكي أو محفظتك. | Collecting your earnings is easier than ever. Multiple payment methods for every student, and instant transfer to your bank or wallet. |
| `methodsTitle` | طرق دفع تناسب الجميع | Payment methods for everyone |
| `calcTitle` | حسبة بسيطة، أرباح مضمونة | Simple math, guaranteed profit |
| `calcCourseLabel` | سعر الكورس | Course price |
| `calcCourseValue` | ٢٥٠ ج.م | EGP 250 |
| `calcStudentsLabel` | عدد الطلاب | Students |
| `calcStudentsValue` | ٥٠٠ | 500 |
| `calcResultLabel` | صافي أرباحك (شهريًا) | Your net profit (monthly) |
| `calcResultValue` | ١٢٥,٠٠٠ ج.م | EGP 125,000 |
| `cardsTitle` | كروت شحن للطلاب | Student top-up cards |
| `cardsBadge` | ميزة حصرية | Exclusive |
| `cardsDesc` | اطبع كروت شحن بأكواد فريدة ووزّعها في السناتر أو المكتبات عشان تسهّل الدفع على طلابك اللي معندهمش محفظة إلكترونية. | Print top-up cards with unique codes and hand them out at centers or bookshops so students without an e-wallet can pay easily. |
| `note` | تحويل فوري لحسابك البنكي أو محفظتك بدون تأخير. | Instant transfer to your bank or wallet with no delay. |
| `methods.instapay` | إنستا باي | InstaPay |
| `methods.fawry` | فوري | Fawry |
| `methods.vodafone` | فودافون كاش | Vodafone Cash |
| `methods.meeza` | ميزة | Meeza |
| `methods.card` | Visa / Mastercard | Visa / Mastercard |

> The calc values above are **static strings**. Render them as text. Do not
> multiply `calcCourseValue × calcStudentsValue`.

### `comparison`
| key | ar | en |
|---|---|---|
| `heading` | ليه مش الواتساب وبس؟ | Why not just WhatsApp? |
| `highlight` | الواتساب | WhatsApp |
| `subtitle` | الطرق التقليدية بتضيّع وقتك ومجهودك. شوف بنفسك إزاي إلمني بيوفّرلك بيئة احترافية متكاملة. | The old ways waste your time and effort. See how Elemni gives you a complete, professional environment. |
| `colElemni` | إلمني | Elemni |
| `colWhatsapp` | واتساب + درايف | WhatsApp + Drive |
| `colYoutube` | يوتيوب (Unlisted) | YouTube (Unlisted) |
| `colOthers` | منصات أخرى | Other platforms |
| `rowLeak` | حماية من التسريب | Leak protection |
| `rowPay` | دفع أوتوماتيك | Automatic payments |
| `rowOrganize` | ترتيب بالصف والشعبة | Organized by grade & track |
| `rowReports` | تقارير تفصيلية للطلاب | Detailed student reports |
| `rowApp` | تطبيق موبايل خاص | Dedicated mobile app |
| `rowSetup` | وقت التجهيز والبدء | Setup time |
| `partial` | جزئي | Partial |
| `setupElemni` | ٥ دقائق | 5 minutes |
| `setupWhatsapp` | أيام | Days |
| `setupYoutube` | ساعات | Hours |
| `setupOthers` | أسابيع | Weeks |
| `cta` | ابدأ مع إلمني دلوقتي | Start with Elemni now |

Cell values matrix (build in `data.ts`, booleans/`"partial"`; render check/x/text):
| row | Elemni | WhatsApp | YouTube | Others |
|---|---|---|---|---|
| Leak | ✓ | ✗ | partial | ✓ |
| Pay | ✓ | ✗ | ✗ | partial |
| Organize | ✓ | ✗ | ✗ | ✓ |
| Reports | ✓ | ✗ | ✗ | partial |
| App | ✓ | ✗ | ✗ | ✗ |
| Setup | setupElemni | setupWhatsapp | setupYoutube | setupOthers |

### `beforeAfter`
| key | ar | en |
|---|---|---|
| `heading` | ريح دماغك من وجع الدماغ | Save yourself the headache |
| `subtitle` | الفرق بين الطريقة القديمة المتعبة والمنصة اللي بتشتغل لك. | The difference between the tiring old way and a platform that works for you. |
| `withTitle` | مع إلمني | With Elemni |
| `withoutTitle` | طريقتك دلوقتي | Your way right now |
| `with.1.title` | حماية بث مشدّدة | Strong streaming protection |
| `with.1.desc` | علامة مائية متحركة وتشفير بيمنع التحميل تمامًا. | A moving watermark and encryption that fully blocks downloads. |
| `with.2.title` | مدفوعات أوتوماتيك | Automatic payments |
| `with.2.desc` | الطالب بيدفع، والحصة تتفتح في نفس اللحظة بدون تدخل منك. | The student pays and the lesson unlocks instantly, no action from you. |
| `with.3.title` | تقارير طالب بطالب | Student-by-student reports |
| `with.3.desc` | تحليلات دقيقة بتعرّفك مستوى وتفاعل كل طالب. | Precise analytics on each student's level and engagement. |
| `with.4.title` | مكتبة دائمة ومستمرة | A permanent library |
| `with.4.desc` | كورساتك موجودة على طول والطلاب بيوصلوا لها بسهولة. | Your courses stay available and students reach them easily. |
| `with.cta` | انقل شغلك للمستوى الجاي | Take your work to the next level |
| `without.1.title` | فيديوهات بتتسرّب | Leaked videos |
| `without.1.desc` | شرحك بيروح على التليجرام وتعبك بيروح ببلاش. | Your lessons end up on Telegram and your effort goes to waste. |
| `without.2.title` | مطاردة فلوس فودافون كاش | Chasing Vodafone Cash payments |
| `without.2.desc` | مراجعة رسائل وتحويلات يدوية بتاخد وقتك كله. | Checking messages and manual transfers eats all your time. |
| `without.3.title` | مفيش متابعة حقيقية | No real tracking |
| `without.3.desc` | معرفش مين شاف الفيديو ومين ساب نصه. | You don't know who watched or who dropped off. |
| `without.4.title` | جروبات بتتعمل من الصفر | Groups rebuilt from scratch |
| `without.4.desc` | كل ترم بتعمل جروبات جديدة وتلمّ الطلاب تاني. | Every term you rebuild groups and re-gather students. |

### `steps`
| key | ar | en |
|---|---|---|
| `heading` | تبدأ إزاي؟ ٣ خطوات بس | How do you start? Just 3 steps |
| `subtitle` | أسهل منصة ممكن تتعامل معاها، صممناها عشان توفّر وقتك. | The easiest platform to use — built to save your time. |
| `1.title` | ارفع دروسك | Upload your lessons |
| `1.desc` | اسحب فيديوهاتك والمذكرات، وسيب المنصة تعالجها في ثواني. | Drag in your videos and notes and let the platform process them in seconds. |
| `2.title` | نظّم محتواك | Organize your content |
| `2.desc` | قسّم الدروس لصفوف ومحاضرات، وحدّد سعر كل درس أو اشتراك شهري. | Split lessons into grades and lectures, and set a price per lesson or a monthly subscription. |
| `3.title` | شارك اللينك | Share the link |
| `3.desc` | ابعت لينك منصتك للطلاب، والمنصة هتقفل عملية الدفع وتفعيل الحسابات أوتوماتيك. | Send your platform link to students; payment and account activation happen automatically. |
| `cta` | ابدأ تجربتك المجانية دلوقتي | Start your free trial now |

### `migration`
| key | ar | en |
|---|---|---|
| `heading` | عندك طلاب بالفعل؟ إحنا هننقلهم معاك. | Already have students? We'll move them with you. |
| `1.title` | ابعتلنا كشف طلابك وفيديوهاتك | Send us your student list and videos |
| `2.title` | إحنا نرفع ونرتّب كل حاجة | We upload and organize everything |
| `3.title` | منصتك تشتغل خلال ٤٨ ساعة | Your platform is live within 48 hours |
| `cta` | كلّم فريقنا | Talk to our team |
| `note` | مجانًا لأي مدرس عنده أكثر من ٥٠ طالب. | Free for any teacher with more than 50 students. |

### `testimonials`
| key | ar | en |
|---|---|---|
| `heading` | آراء شركاء النجاح | What our success partners say |
| `1.quote` | سهولة الدفع للطلاب كانت ممتازة، وكروت الشحن وفّرت علينا وقت ومجهود كبير جدًا. | Payment was so easy for students, and the top-up cards saved us a huge amount of time and effort. |
| `1.name` | أ. أحمد كمال | Mr. Ahmed Kamal |
| `1.role` | مدرس فيزياء - الإسكندرية | Physics teacher – Alexandria |
| `1.result` | نمو ٥٠٪ في المبيعات | 50% sales growth |
| `2.quote` | حماية الفيديوهات كانت أكبر عائق ليا، ومع إلمني قدرت أرفع محتوايا وأنا مطمئن ١٠٠٪. | Video protection was my biggest obstacle; with Elemni I upload my content 100% reassured. |
| `2.name` | أ. منى السيد | Ms. Mona El-Sayed |
| `2.role` | مدرسة أحياء - الجيزة | Biology teacher – Giza |
| `2.result` | حماية كاملة للمحتوى | Full content protection |
| `3.quote` | منصة قوية جدًا وسهلة الاستخدام، قدرت أوصل لعدد كبير من الطلاب في وقت قصير، والدعم الفني ممتاز. | A powerful, easy platform. I reached many students fast and the support is excellent. |
| `3.name` | أ. محمود حسن | Mr. Mahmoud Hassan |
| `3.role` | مدرس لغة عربية - القاهرة | Arabic teacher – Cairo |
| `3.result` | ٣٤٠+ طالب في ترم واحد | 340+ students in one term |

### `pricing`
| key | ar | en |
|---|---|---|
| `heading` | أسعار واضحة. من غير مفاجآت. | Clear pricing. No surprises. |
| `monthly` | شهريًا | Monthly |
| `annual` | سنويًا | Annual |
| `annualBadge` | وفّر شهرين | Save 2 months |
| `perMonth` | / شهر | / month |
| `commission` | عمولة {n}٪ | {n}% commission |
| `commissionSub` | على كل مبيعة | on each sale |
| `popular` | الأكثر اختيارًا | Most popular |
| `note` | العمولة بتغطي رسوم الدفع (فوري، فودافون كاش، فيزا). كل ما تكبر، كل ما تقل. | The commission covers payment fees (Fawry, Vodafone Cash, Visa). The bigger you grow, the lower it gets. |
| `free.name` | مجاني | Free |
| `free.price` | ٠ | 0 |
| `free.commission` | ١٠ | 10 |
| `free.f1` | ٥٠ طالب | 50 students |
| `free.f2` | ١٠ جيجا مساحة تخزين | 10 GB storage |
| `free.f3` | حماية أساسية للمحتوى (DRM) | Basic content protection (DRM) |
| `free.cta` | ابدأ مجانًا | Start free |
| `pro.name` | احترافي | Pro |
| `pro.price` | ٤٩٩ | 499 |
| `pro.commission` | ٥ | 5 |
| `pro.f1` | عدد طلاب لا محدود | Unlimited students |
| `pro.f2` | ٥٠٠ جيجا مساحة تخزين | 500 GB storage |
| `pro.f3` | حماية متقدمة للمحتوى (Full DRM) | Advanced protection (Full DRM) |
| `pro.f4` | نظام امتحانات متكامل | Full exam system |
| `pro.cta` | اشترك الآن | Subscribe now |
| `academy.name` | أكاديمية | Academy |
| `academy.price` | ١٤٩٩ | 1499 |
| `academy.commission` | ٢ | 2 |
| `academy.f1` | تطبيق باسم الأكاديمية | App under your academy's name |
| `academy.f2` | مساحة تخزين لا محدودة | Unlimited storage |
| `academy.f3` | مدير حساب مخصص | Dedicated account manager |
| `academy.cta` | تواصل معنا | Contact us |

### `faq`
| key | ar | en |
|---|---|---|
| `heading` | الأسئلة الشائعة | Frequently asked questions |
| `subtitle` | كل اللي محتاج تعرفه عشان تبدأ بثقة. | Everything you need to know to start with confidence. |
| `q1` | المحتوى بتاعي يفضل ملكي؟ | Does my content stay mine? |
| `a1` | أكيد، المحتوى الخاص بك يظل ملكًا لك بنسبة ١٠٠٪. إحنا بس بنوفّر لك المنصة والأدوات لحمايته وبيعه بأمان. مش بندّعي أي حقوق على فيديوهاتك أو موادك التعليمية. | Absolutely. Your content stays 100% yours. We only provide the platform and tools to protect and sell it safely. We claim no rights over your videos or materials. |
| `q2` | الطلاب بيدفعوا إزاي؟ | How do students pay? |
| `a2` | الطالب بيدفع بأي طريقة تناسبه — إنستا باي، فوري، فودافون كاش، فيزا، أو كروت الشحن — والحصة بتتفعّل فورًا. | Students pay however suits them — InstaPay, Fawry, Vodafone Cash, Visa, or top-up cards — and the lesson activates instantly. |
| `q3` | الفيديوهات ممكن تتسرّب؟ | Can the videos be leaked? |
| `a3` | فيديوهاتك متشفّرة بتقنية DRM مع علامة مائية باسم الطالب، وبنقفل أي محاولة تسجيل للشاشة. | Your videos are DRM-encrypted with a per-student watermark, and we block any screen-recording attempt. |
| `q4` | محتاج خبرة تقنية؟ | Do I need technical skills? |
| `a4` | لأ خالص. لو بتعرف ترفع فيديو على واتساب، تقدر تستخدم إلمني. وفريقنا بيساعدك في التجهيز. | Not at all. If you can send a video on WhatsApp, you can use Elemni — and our team helps you set up. |
| `q5` | العمولة بتتحسب إزاي؟ | How is the commission calculated? |
| `a5` | العمولة نسبة من كل عملية بيع، بتغطي رسوم الدفع، وبتقل كل ما باقتك تكبر. | The commission is a share of each sale that covers payment fees and drops as your plan grows. |
| `q6` | أقدر أنقل طلابي الحاليين؟ | Can I migrate my current students? |
| `a6` | آه، فريقنا بينقل طلابك وفيديوهاتك خلال ٤٨ ساعة، ومجانًا لو عندك أكثر من ٥٠ طالب. | Yes — our team migrates your students and videos within 48 hours, free if you have more than 50 students. |

### `finalCta`
| key | ar | en |
|---|---|---|
| `heading` | أول محاضرة ليك على بُعد ١٠ دقايق | Your first lecture is 10 minutes away |
| `subtitle` | ابدأ رحلتك التدريسية الرقمية بسهولة وبدون تعقيدات. | Start your digital teaching journey easily, no complications. |
| `emailPlaceholder` | البريد الإلكتروني | Email address |
| `cta` | أنشئ حسابك المجاني | Create your free account |
| `note` | انضم لأكثر من ٣,٠٠٠ مدرس بيكسبوا على إلمني. | Join 3,000+ teachers earning on Elemni. |

### `footer`
| key | ar | en |
|---|---|---|
| `privacy` | سياسة الخصوصية | Privacy policy |
| `terms` | الشروط والأحكام | Terms & conditions |
| `help` | مركز المساعدة | Help center |
| `contact` | اتصل بنا | Contact us |
| `rights` | © ٢٠٢٤ إلمني. جميع الحقوق محفوظة. | © 2024 Elemni. All rights reserved. |
| `madeIn` | صُنع في مصر بكل فخر 🇪🇬 | Proudly made in Egypt 🇪🇬 |

---

## 4. Page composition

`src/app/[locale]/(marketing)/page.tsx` — a Server Component that renders the
sections **top to bottom in this order**. Alternate backgrounds as noted.

1. `Hero` — gradient bg
2. `StatsBar` — white
3. `FeaturesGrid` — lavender
4. `DrmSection` — dark
5. `CurriculumSection` — lavender
6. `VideoDemo` — white
7. `PaymentsSection` — white
8. `ComparisonTable` — lavender
9. `BeforeAfter` — white
10. `StepsSection` — lavender
11. `MigrationSection` — lavender
12. `Testimonials` — white
13. `PricingSection` — lavender
14. `FaqSection` — white
15. `FinalCta` — gradient bg

`Header` and `Footer` go in
`src/app/[locale]/(marketing)/layout.tsx` wrapping `{children}`.

Also add `generateStaticParams` + `setRequestLocale(locale)` in the marketing
layout/page so the page is statically rendered per locale (marketing pages are
static/ISR per `CLAUDE.md`).

Every section component:
- Is a **Server Component** unless it needs interactivity (see §6).
- Reads copy with `useTranslations("<namespace>")` — for Server Components use
  `getTranslations` from `next-intl/server` (or `useTranslations`, which works
  in RSC in next-intl). Confirm the correct call for the installed version.
- Uses the `Section` primitive for consistent spacing/width/background.

---

## 5. Per-section build specs

For each: **layout** + which **i18n namespace** + any **sample data**. Icons are
from `lucide-react`. All spacing uses logical properties.

### 5.1 `Header` (`header.tsx`) — needs `"use client"` (mobile menu + lang switch)
- Sticky top bar, translucent white (`bg-white/80 backdrop-blur`), subtle bottom
  border.
- Layout (RTL): **brand name** (`brand.name`, bold, `text-brand-700`, small
  logo mark to its side) on the start; nav links in the center
  (`nav.home/features/pricing/faq/stories`, anchor links to section `id`s); on
  the end: language switch (`nav.switchLang`), `nav.login` (text link),
  `nav.cta` (amber pill).
- Mobile: collapse nav into a hamburger (lucide `Menu`) toggling a dropdown.
- Language switch flips locale via `usePathname`/`useRouter` from
  `src/i18n/navigation.ts`.
- Give each landing section an `id` (`#features`, `#pricing`, `#faq`, etc.) so
  nav anchors work.

### 5.2 `Hero` (`hero.tsx`) — `bg-hero-gradient`, white text
- Two-column on desktop (`grid md:grid-cols-2 gap-10 items-center`), stacked on
  mobile. **In RTL the text column is on the start (right), mockup on the end
  (left)** — with logical grid this is automatic.
- Text column: amber badge pill (`hero.badge`, with a small shield/lock icon) →
  big bold headline (`hero.title`, `text-4xl md:text-5xl`, white; you may
  underline "الواتساب" via a `<span>` with an accent underline) → subtitle
  (`hero.subtitle`, `text-white/80`) → button row: primary amber
  (`hero.ctaPrimary`) + outline/ghost white (`hero.ctaSecondary`, with a small
  play icon).
- Mockup column: a **placeholder** rounded card (`next/image` of a placeholder
  or a styled `div` with `bg-white/10 rounded-3xl aspect-[4/3]`) representing the
  teacher dashboard. Keep it simple; no real chrome.

### 5.3 `StatsBar` (`stats-bar.tsx`) — white
- A single row, 3 equal columns (`grid grid-cols-1 sm:grid-cols-3`), centered,
  with thin vertical dividers between (use `divide-x` — acceptable because a
  divider is symmetric; if lint complains use borders with logical sides).
- Each: big bold `value` (`text-brand-700 text-3xl`) over muted `label`.
- Data from `stats.earnings/students/teachers` (`{value,label}`).
- Optional: a small row of subject icons below (globe/sigma/flask/book —
  lucide). Decorative; no text.

### 5.4 `FeaturesGrid` (`features-grid.tsx`) — lavender, `id="features"`
- Centered heading (`features.heading`).
- `grid gap-6 md:grid-cols-3` of **6 white cards**. Each card: a soft square
  icon chip (rounded-2xl, tinted bg) top, then bold title, then muted desc.
- Icon + tint per card (from `data.ts`):
  | key | icon | tint |
  |---|---|---|
  | exams | `ClipboardCheck` | success/mint |
  | organize | `FolderStar` (or `Folder`) | amber |
  | drm | `ShieldCheck` | pink/rose |
  | mobile | `Smartphone` | blue |
  | payments | `Banknote` | orange |
  | reports | `LineChart` | violet |

### 5.5 `DrmSection` (`drm-section.tsx`) — `bg-brand-900`, white text
- Two columns: text (start) + placeholder video/laptop mockup (end).
- Text: small amber badge (`drmSection.badge`) → heading (`drmSection.heading`,
  white, "DRM" can be accent-colored) → subtitle (`text-white/70`) → list of 4
  items, each a green `CircleCheck` + bold title + muted desc
  (`encrypted/watermark/devices/instantBan`).
- Mockup: placeholder `div`/image with a small floating pill badge
  (`drmSection.mockupBadge`) with a red dot + `VideoOff` icon.

### 5.6 `CurriculumSection` (`curriculum-section.tsx`) — lavender
- Centered heading + subtitle.
- A **filter chip row** (static, decorative — not functional): render chips from
  `curriculum.filters.*`; style the "active" one(s) filled brand, rest light.
  These are **display only** — do not build filtering logic.
- `grid gap-6 md:grid-cols-3` of **3 lesson cards** from `data.ts`:
  ```ts
  // features/marketing/data.ts
  export const LESSONS = [
    { key: "light",   priceKey: "free", duration: "١٥:٠٠", durationEn: "15:00" },
    { key: "current", price: "٥٠", priceEn: "50", duration: "٣٨:١٥", durationEn: "38:15" },
    { key: "ohm",     price: "٩٠", priceEn: "90", duration: "٤٤:٢٠", durationEn: "44:20" },
  ] as const;
  ```
  Each card: placeholder thumbnail (`next/image`, `aspect-video`,
  `rounded-2xl`, gradient bg) with the duration as a small overlay pill; below:
  chapter badge (`curriculum.lessons.<key>.chapter`), bold title
  (`.title`), grade (`.grade`), and price row (`curriculum.free` when free, else
  `curriculum.price` with `{n}`), plus a small "تفعيل الدرس"/link.
- `curriculum.cta` outline button, centered under the grid.

### 5.7 `VideoDemo` (`video-demo.tsx`) — white
- Centered heading (`videoDemo.heading`, with a small circular play icon by it)
  + subtitle.
- A large **placeholder** video frame: rounded dark card (`aspect-video`,
  `rounded-3xl`, `bg-brand-900`) with a centered amber circular play button
  (`Play` icon) and a fake control bar at the bottom (decorative — a progress
  line + time text `2:10 / 0:45`). Use a `next/image` placeholder or styled div.
- Below: a row of 3 pills (`videoDemo.pill.upload/organize/collect`), each with a
  small icon.

### 5.8 `PaymentsSection` (`payments-section.tsx`) — white
- Centered heading (`payments.heading`) + subtitle.
- Grid of two cards on top (`md:grid-cols-2`):
  - **Methods card** (`payments.methodsTitle`): wallet icon + a wrapped row of
    method chips (`payments.methods.*`), each with a small colored dot.
  - **Calculator card** (`payments.calcTitle`): show
    `calcCourseLabel/Value` `×` `calcStudentsLabel/Value` then a highlighted
    result box `calcResultLabel` + big amber `calcResultValue`.
    **STATIC TEXT ONLY — no inputs, no multiplication.**
- **Top-up cards feature** (`payments.cardsTitle`): an amber-bordered card with a
  placeholder card image, `cardsBadge` pill, and `cardsDesc`.
- A full-width note pill (`payments.note`) with a green check, centered.

### 5.9 `ComparisonTable` (`comparison-table.tsx`) — lavender
- Centered heading (`comparison.heading`; highlight `comparison.highlight` word
  in accent/underline) + subtitle.
- A responsive table. **Columns** (start→end in RTL): feature label column, then
  `colElemni` (highlighted — purple header pill, this column emphasized),
  `colWhatsapp`, `colYoutube`, `colOthers`.
- **Rows** from the matrix in §3 (`comparison` namespace + `data.ts` matrix).
  Render `true`→ green `CircleCheck`, `false`→ red `CircleX`, `"partial"`→
  `comparison.partial` chip, and the setup row renders text values.
- On mobile, allow horizontal scroll (`overflow-x-auto`) — don't crush it.
- `comparison.cta` amber button centered below.

### 5.10 `BeforeAfter` (`before-after.tsx`) — white
- Centered heading (`beforeAfter.heading`) + subtitle.
- Two cards side by side (`md:grid-cols-2`):
  - **With card** (`beforeAfter.withTitle`): **purple gradient** bg, white text,
    star/brand mark; 4 items each with green `CircleCheck` + bold title + desc
    (`with.1..4`); an amber CTA at the bottom (`with.cta`, with an end-arrow that
    **mirrors in RTL** — use a logical arrow or `rtl:rotate-180`).
  - **Without card** (`beforeAfter.withoutTitle`): white bg, a sad-face icon; 4
    items each with red `CircleX` + bold title + desc (`without.1..4`).

### 5.11 `StepsSection` (`steps-section.tsx`) — lavender
- Centered heading (`steps.heading`) + subtitle.
- 3 columns (`md:grid-cols-3`). **Number the steps 1‑2‑3**; in RTL step 1 is on
  the **right**. Each: a colored numbered circle (use accent/brand/teal to vary,
  matching design: step1 amber, step2 violet, step3 teal), bold title, desc, and
  a small placeholder screenshot image below.
- `steps.cta` amber button centered.

### 5.12 `MigrationSection` (`migration-section.tsx`) — lavender
- Centered heading (`migration.heading`).
- 3 cards (`md:grid-cols-3`), each: soft icon chip (rocket/sparkles/upload),
  numbered `(1)(2)(3)`, bold title (`migration.1/2/3.title`). No body text.
- `migration.cta` outline (purple) button centered + muted `migration.note`
  under it.

### 5.13 `Testimonials` (`testimonials.tsx`) — white, `id="stories"`
- Centered heading (`testimonials.heading`).
- 3 cards (`md:grid-cols-3`). Each: a large decorative quote mark (`"99"` style,
  accent color) at the top-end, the quote (`testimonials.1/2/3.quote`), a
  divider, then avatar placeholder (`next/image` round) + name + role, and a
  green result badge at the bottom (`.result`, with an up-trend icon).

### 5.14 `PricingSection` (`pricing-section.tsx`) — lavender, `id="pricing"`
- Centered heading (`pricing.heading`).
- **`PricingToggle`** (`"use client"`): monthly/annual switch
  (`pricing.monthly/annual`) with `pricing.annualBadge`. It flips a local state;
  since prices are static copy, toggling can simply swap which price string
  shows (annual could reuse the monthly strings for now — keep simple; the state
  is presentational). Do **not** compute discounts.
- 3 plan cards (`md:grid-cols-3`), order start→end: `academy`, `pro`, `free`
  (matches design: Academy right, Pro center/highlighted, Free left in RTL). The
  **`pro`** card is highlighted: purple border, slight scale, `pricing.popular`
  amber badge on top.
- Each card: plan name, big price (`{price}` + `pricing.perMonth`), a
  `commission` chip (`{n}` via ICU) with `commissionSub`, a feature list (green
  checks, `f1..f4`), and a CTA button (`free.cta` outline, `pro.cta` purple,
  `academy.cta` outline).
- Full-width `pricing.note` pill below, with an info icon.

### 5.15 `FaqSection` (`faq-section.tsx`) — white, `id="faq"`
- Centered heading (`faq.heading`) + subtitle.
- **Accordion** (`"use client"`): 6 items (`q1/a1 … q6/a6`). First item open by
  default. Each row: white rounded card, question + chevron (`ChevronDown`,
  rotates on open); expanded shows the answer. Manage open state with `useState`
  (single-open or multi-open, your call — single-open matches the design).
- Keep it accessible: real `<button>` toggles, `aria-expanded`.

### 5.16 `FinalCta` (`final-cta.tsx`) — `bg-cta-gradient`, white text, centered
- Big heading (`finalCta.heading`) + subtitle.
- An inline form row (centered, `max-w-md`): email `<input>`
  (`finalCta.emailPlaceholder`) + amber button (`finalCta.cta`). **No
  submission logic / no API** — it's a marketing capture stub; a plain
  non-functional form (or one that does nothing on submit) is fine for now.
  Leave a `// TODO: wire to signup` comment.
- Muted `finalCta.note` below with a graduation-cap icon.

### 5.17 `Footer` (`footer.tsx`) — `bg-brand-900` (or brand-700), white text
- Centered brand name (`brand.name`, bold).
- A centered row of links (`footer.privacy/terms/help/contact`).
- `footer.rights` and `footer.madeIn` muted, centered, stacked.

---

## 6. Which components are `"use client"`
Only these need it (keep the rest Server Components):
- `header.tsx` — mobile menu toggle + language switch.
- `pricing-toggle.tsx` — monthly/annual state.
- `faq-section.tsx` — accordion state.

Everything else renders on the server with no JS shipped.

---

## 7. Placeholder assets
Put simple placeholders in `public/` (or use solid/gradient `div`s). Suggested:
- `public/placeholders/dashboard.png` — hero mockup (or gradient div).
- `public/placeholders/video.png` — video frame (or dark div).
- `public/placeholders/lesson-1..3.png` — lesson thumbnails (gradient divs fine).
- `public/placeholders/step-1..3.png` — step screenshots.
- `public/placeholders/avatar-1..3.png` — testimonial avatars (round).
Every `next/image` needs explicit `width`/`height` (or `fill` + sized parent) to
avoid CLS, per `CLAUDE.md` performance rules. If you skip real images, use styled
`div`s with `aria-hidden` instead — but keep dimensions fixed.

---

## 8. Build order (checkpoints)
Do it in this sequence; verify the app boots after each foundation step.
1. **Foundation** (§1): deps, `src/` move, next-intl wiring, fonts, root layout,
   `globals.css` tokens. Create `messages/ar.json` + `messages/en.json` with all
   keys from §3. **Checkpoint:** `npm run dev`, visit `/ar` and `/en` — a bare
   page renders, `dir` flips, no console errors.
2. **UI primitives** (§2): `Section`, `Button`, `Badge`, `cn`.
3. **Skeleton page**: `page.tsx` + marketing `layout.tsx` importing empty
   section components (each just renders its heading). **Checkpoint:** all 17
   sections stack in order, both locales.
4. **Fill sections** top-to-bottom (§5). Do `Header`, `Hero`, `Footer` first so
   the page frame looks right, then the rest.
5. **Interactive bits** (§6): header menu/lang switch, pricing toggle, FAQ.
6. **Polish:** spacing rhythm, responsive (test at 375px, 768px, 1280px),
   hover/focus states, section anchor links.

## 9. Acceptance criteria
- [ ] `npm run build` passes (this is the real typecheck + lint gate) and
      `npm run lint` is clean.
- [ ] `/ar` renders **RTL**, `/en` renders **LTR**; `<html dir>` and `lang` are
      correct.
- [ ] **Zero hardcoded user-facing strings** — every word comes from
      `messages/*.json`. Grep the components for Arabic/English literals; there
      should be none.
- [ ] **No physical-direction classes** (`ml-/mr-/pl-/pr-/left-/right-/text-left/
      text-right`). Only logical (`ms/me/ps/pe/start/end`). Direction-implying
      arrows mirror in RTL.
- [ ] No `fetch`/API calls, no auth, no money math, no live calculator. The
      earnings figure and prices are static strings.
- [ ] All 17 sections present, in order, matching the copy tables. Layout is
      responsive at 375 / 768 / 1280.
- [ ] `next/image` used with explicit dimensions (or fixed-size placeholder
      divs); no layout shift.
- [ ] Server Components by default; only the 3 components in §6 are `"use
      client"`.

## 10. Open items to flag to the team (do not block on these)
- **FAQ answers a2–a6** and some micro-copy were not fully legible in the
  mockups — the EN/AR provided are sensible reconstructions. Confirm with
  product before launch.
- **Prices / commission %** are static marketing copy here. In the real product
  these must come from the API (per `CLAUDE.md` money rules); this page is
  display-only.
- **"Watch demo", email capture, and CTA buttons** currently link nowhere. Wire
  them to real routes/signup when those exist.
- Confirm the **section order** in §4 matches the intended final scroll (the
  design PNGs are section crops; order was inferred).
```
