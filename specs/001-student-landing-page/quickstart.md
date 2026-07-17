# Quickstart: Student Landing Page (Default)

**Branch**: `001-student-landing-page` | **Date**: 2026-07-17

Runnable validation scenarios that prove the feature works end-to-end. This is a
validation guide, NOT an implementation recipe — code belongs in `tasks.md` and
the implementation phase. Refer to `data-model.md` and `contracts/` for details
rather than re-stating them here.

## Prerequisites

- Node.js and pnpm/npm matching `package.json` (Next.js 16.2.10, React 19.2).
- `npm install` has run in the repo root.
- Optional (for catalog contract tests): staging backend reachable, or MSW
  fixtures committed under `tests/contract/fixtures/`.
- Optional (for Playwright E2E): Chromium available via Playwright.

## Setup

```bash
npm install
npm run dev
```

The dev server listens on `http://localhost:3000`. Arabic (`/`) is the default;
English is at `/en`.

## Runnable validation scenarios

### V1 — Default student landing renders at root (FR-001, FR-002, SC-001)

1. Visit `http://localhost:3000/` in a fresh private window.
2. Expected: a **student-oriented** landing renders in Arabic, right-to-left
   (`<html lang="ar" dir="rtl">`), within ~3 s on a throttled 3G profile.
3. Expected: the hero and primary CTAs (browse, sign up, sign in) render
   without JS — disable JS in devtools and reload; the informational shell and
   CTA links still display.
4. Pass when the above holds; data-model reference: `Subject`, `Featured Content`.

### V2 — Language toggle re-localizes the page (FR-003, SC-002, SC-006)

1. From the default Arabic landing, click the language toggle in the header.
2. Expected: URL becomes `/en`; all user-facing text renders in English, direction
   switches to LTR, Latin digits appear, direction-implying icons mirror.
3. Toggle back to Arabic; expected: URL `/`, RTL, Arabic-Indic numerals.
4. Spot-check no string remains untranslated in either direction.

### V3 — Teacher landing is at a distinct path (FR-006, FR-007, SC-004)

1. Visit `http://localhost:3000/teachers`.
2. Expected: the relocated teacher marketing landing renders (Arabic, RTL).
3. Visit `http://localhost:3000/en/teachers`; expected: English, LTR.
4. Visit `http://localhost:3000/`; expected: the **student** landing, not the
   teacher landing.

### V4 — Footer link to teacher landing (FR-011, SC-007)

1. From the Arabic student landing, scroll to the footer.
2. Expected: a "للمدرسين" (For Teachers) link is visible within the bottom
   area, pointing to `/teachers` (locale-resolved by next-intl).
3. Click it; expected: lands on the teacher landing.

### V5 — Contact Us section at the bottom (FR-012, FR-013, SC-007)

1. From the student landing, scroll to the bottom.
2. Expected: a "Contact Us" section is visible in the footer/bottom area.
3. Without a backend contact endpoint configured (v1 fallback), expected: a
   `mailto:` link with the platform's contact email, in the active locale. The
   submission form is NOT shown (Article V — no fake success).
4. With a backend contact endpoint configured: the form renders; submitting
   shows a `submitting` state; on `202` it transitions to `success`; on
   `Upstream`/`Network`/`RateLimited` it shows a localized actionable error.

### V6 — Backend unavailable / slow (FR-008, FR-010, SC-005)

1. With the dev server running, point the catalog API to an unreachable URL
   (e.g., set the API URL env to `http://localhost:9999`).
2. Visit the student landing.
3. Expected: the static marketing shell + hero + CTAs paint; catalog-driven
   sections render skeletons or fallback static content; no blank page; no
   crash; a "retry" affordance appears on the failed sections.

### V7 — Build / lint gate

```bash
npm run build
npm run lint
```

Expected: both succeed with no errors. `npm run build` is the strict typecheck +
lint gate (`tsc` runs via `next build`); `npm run lint` includes the
physical-direction-utility ban (constitution Article III).

### V8 — Contract tests (constitution Article XIII, mandatory for any wired endpoint)

```bash
npm run test -- tests/contract
```

Expected: each contract test asserts the repo's zod schemas
(`src/features/student-landing/schemas/*.ts`) against staging fixtures or live
staging responses for the endpoints listed in `contracts/README.md`. Failing
tests block merge.

### V9 — Playwright critical path (both AR and EN)

```bash
npm run test:e2e
```

Expected Playwright scenarios in both `ar` and `en`:

1. Open root → student landing renders.
2. Toggle language → page mirrors.
3. Footer → "For Teachers" → teacher landing renders.
4. Footer → Contact Us → contact affordance renders.

## Expected outcomes summary

- Root serves the student landing 100% of the time for unauthenticated visitors.
- /teachers serves the teacher landing and is reachable via footer link.
- Language toggle fully re-localizes in <1 s.
- Backend-unreachable leaves the landing visible with fallbacks.
- `npm run build` and `npm run lint` pass; contract tests green for any wired
  endpoint.

## Notes

- This is a validation guide only. Implementation tasks go in `tasks.md`.
- Reference contracts: `contracts/README.md` and per-endpoint `.zod.md` files.
- Reference data model: `data-model.md`.
- Reference research: `research.md`.