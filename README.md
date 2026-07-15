# Elemni — Web Frontend

Frontend for **Elemni** (إلمني), a learning platform for Egyptian teachers. Teachers
upload video lessons, organise them by subject / grade / stream, protect them with
DRM, and sell them to students.

Arabic-first (RTL) with full English support. This repo is **frontend only** — all
business logic, persistence, payments, DRM licensing, and video processing live
behind a separate backend API.

> **Status:** early. The only feature built so far is the public marketing landing
> page. There is no auth, no dashboard, and no API integration yet.

---

## Stack

| | |
|---|---|
| Framework | Next.js **16.2.10** (App Router, Turbopack) |
| UI | React **19.2.4**, Server Components by default |
| Styling | Tailwind CSS **v4** (CSS-first `@theme`, no `tailwind.config.js`) |
| i18n | next-intl **v4** — `ar` (default, RTL) + `en` (LTR) |
| Icons | lucide-react |

Requires **Node >= 20.9**. Package manager is **npm**.

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

### Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build — **the real typecheck gate** (`tsc` runs here) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

> **Run `npm run lint` explicitly.** Next 16 does **not** run ESLint as part of
> `next build`, so a green build does not mean a clean lint.

There is **no test runner wired up** — `npm test` does not exist. Adding tests means
adding the dependency and the script first.

---

## Routing & i18n

Locales are `ar` (default) and `en`, with `localePrefix: "as-needed"`:

| URL | Renders |
|---|---|
| `/` | Arabic, RTL (`/ar` **redirects here** — the default locale is unprefixed) |
| `/en` | English, LTR |

`<html lang>` and `dir` are set per locale in `src/app/[locale]/layout.tsx`.
Fonts are Cairo (AR) and Inter (EN) via `next/font`.

**Rules:**

- **No hardcoded user-facing strings.** Every word goes through next-intl and lives
  in `src/messages/{ar,en}.json`. Both files must stay key-for-key identical.
- **RTL is the default, not an afterthought.** Use logical Tailwind utilities only —
  `ms`/`me`, `ps`/`pe`, `start`/`end`, `text-start`/`text-end`. Never `ml`/`mr`/
  `pl`/`pr`/`left`/`right`/`text-left`/`text-right`.
- Watch out for **physical transforms**: `-translate-x-1/2` does not mirror in RTL
  and will mis-centre things. Prefer a flex-centred wrapper.
- Direction-implying icons (arrows, chevrons) must mirror in RTL.
- Numerals: Arabic-Indic in Arabic UI via `Intl.NumberFormat("ar-EG")`; Latin digits
  in IDs, URLs, and code.

**Check every UI change in both directions before merging.**

---

## Project structure

```
src/
  app/
    [locale]/
      (marketing)/          # the landing page
      layout.tsx            # html/body, fonts, NextIntlClientProvider
    globals.css             # Tailwind v4 @theme — design tokens live here
  components/ui/            # shared primitives only (Button, Section, Reveal, Counter)
  features/
    marketing/
      components/           # the 15 landing sections
      data.ts               # non-string sample data (icons, matrices, image paths)
  i18n/                     # routing / request / navigation
  lib/cn.ts
  messages/{ar,en}.json     # ALL user-facing copy
  middleware.ts
public/placeholders/        # SVG placeholder art
```

Feature-first, not type-first. Used by one feature → it lives in that feature.
Promote to shared on the **third** usage, not the second. **No barrel files.**

> The path alias is `@/*` → **repo root** (not `src`), so imports read
> `@/src/features/...`.

---

## Design system

Tokens are defined in `src/app/globals.css` under `@theme`. **Never hardcode a hex
value in a component** — add or use a token.

| Token | Value | Used for |
|---|---|---|
| `brand-600` | `#5145E5` | Primary indigo |
| `brand-900` | `#1E1867` | Dark sections (DRM) |
| `brand-50` | `#F4F3FC` | Lavender section backgrounds |
| `accent-500` | `#FFB020` | **Amber — all primary CTAs** |
| `success-500` / `success-700` | `#2ED3B7` / `#0D8F7B` | Teal accents / teal **text** |

Two things to know:

- **The brand indigo is a deliberate departure from the original design mockups**,
  which used purple `#7B2CBF`. The mockups are no longer the colour reference —
  `globals.css` is. The purple ramp is kept commented in that file if you need to
  flip back. Don't "fix" the code back to purple to match an old mockup.
- Use **`success-700` for teal text/icons on light backgrounds**. `success-500` is
  only ~1.9:1 on white and fails WCAG; `-700` is the accessible counterpart.

### Animation

One mechanism, no animation libraries:

- `<Reveal>` — IntersectionObserver fade-up on scroll. Stagger lists with
  `delay={i * 80}`. Never nest a `Reveal` inside a `Reveal`.
- `<Counter>` — counts up on scroll, locale-aware formatting.
- Keyframes (`fade-up`, `float`, `pulse-ring`) are declared in `globals.css`.

**Every animation must be `motion-safe:`-prefixed**, and only `opacity` and
`transform` are animated — never `height`/`top`/`left`/`width`/`margin`. A global
`prefers-reduced-motion` guard is in `globals.css` as a backstop. Users are on
Egyptian mobile networks; budget for 3G, not your laptop.

---

## The boundary (important)

**This repo owns:** rendering, routing, i18n/RTL, form UX, accessibility, performance.

**This repo does NOT own:** business rules, authorization, money maths, DRM policy,
or the source of truth for anything.

If you find yourself writing a rule here — a tier limit, a commission percentage —
**stop.** It belongs in the API. The frontend may *display* a rule the API tells it
about; it may never *be* the rule.

- **Money is displayed, never computed.** Figures on the landing page are static
  display copy. No arithmetic, no live calculators.
- **DRM is enforced server-side**, at license issuance and in the transcode
  pipeline. This repo configures a player and renders marketing copy. Do **not**
  implement client-side "enforcement" (device checks, CSS watermark overlays) — it
  is trivially bypassed. The watermark in the DRM section is an explicitly
  decorative mockup with sample data, not a control.

See `CLAUDE.md` for the full architecture rules.

---

## Known gaps

Honest list of what is stubbed:

- **Pricing shows a contact CTA, not tiers.** The pricing model is not decided yet,
  so no prices or commission rates ship. Do not reintroduce numbers from old
  mockups — when pricing exists it comes from the API.
- **CTAs link nowhere.** Buttons and the email capture in the final CTA are inert
  (`// TODO: wire to signup`). No form submission, no analytics.
- **Imagery is placeholder SVG** (`public/placeholders/`), not final artwork.
- **No tests.** Intended stack is Vitest + MSW + Playwright; none installed.
- Curriculum filter chips are decorative and non-interactive by design.

---

## Conventions

- Files `kebab-case.ts`, components `PascalCase`.
- `any` is banned — use `unknown` plus a parse.
- Server Components by default. `"use client"` needs a reason (state, effects, event
  handlers, browser APIs) and should be pushed as far down the tree as possible.
  Currently only 4 files have it.
- When the API arrives: one fetch wrapper in `src/lib/api/`, `zod`-parse every
  response at the boundary, tokens in httpOnly cookies only — never `localStorage`.
