# Implementation Plan: Student Landing Page (Default)

**Branch**: `001-student-landing-page` | **Date**: 2026-07-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-student-landing-page/spec.md`

## Summary

The site's root address becomes a **student-oriented landing page** that surfaces
what learners can browse/buy (subjects, grades, streams), with calls to action to
browse lessons, sign up, and sign in. The existing teacher-focused marketing page
moves from the root to a distinct **page path** (`/teachers`) reachable via a
"For Teachers" link in the page footer, plus a "Contact Us" section at the
bottom. Both landings are localized Arabic-first (RTL) and English (LTR) via
next-intl. The repo is frontend-only; all catalog data rendered on the student
landing comes from (planned) backend endpoints, fetched server-side with graceful
fallback when those endpoints are slow or unreachable.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2, Next.js 16.2.10 (App Router).

**Primary Dependencies**: next-intl v4 (i18n, `localePrefix: "as-needed"`, locales `["ar","en"]`, default `"ar"`), Tailwind v4 (logical properties only, RTL-first), lucide-react (icons — direction-implying icons MUST mirror), clsx + tailwind-merge via `src/lib/cn.ts`. No `fetch`-scattered client code — every backend call goes through `src/lib/api/` once catalog endpoints exist; until they exist, the landing degrades to statically available marketing content.

**Storage**: N/A (frontend-only; no persistence owned here).

**Testing**: Vitest · MSW · Playwright (intended stack per constitution Article XIII). No tests are wired in the current repo yet — needs scaffolding. Contract tests are MANDATORY for every backend endpoint this feature consumes.

**Target Platform**: Web browser, 3G-class Egyptian mobile connection is the performance baseline; desktop is a secondary target.

**Project Type**: web-app (Next.js App Router frontend, BFF to a separate backend API).

**Performance Goals**: First-paint of the student landing within 3 s on 3G (SC-001); locale toggle mirrors layout within 1 s (SC-006); client bundle kept minimal — Server Components by default, any rich interactions dynamic-imported.

**Constraints**: RTL-first (Arabic default, `dir="rtl"`); physical-direction utilities banned and MUST be ESLint-enforced; tokens never touch client storage; no client-side business rules / money / DRM policy; no clientJS-direct-to-backend calls for authenticated data; `motion-safe:` prefix mandatory on every animation (opacity/transform only); never render a backend-unconfirmed success state.

**Scale/Scope**: One new landing page (root) + relocation of an existing landing to `/teachers` + footer additions (For Teachers link, Contact Us section). No new backend owned here; named endpoint gaps raised, not stitched.

**Unknowns / NEEDS CLARIFICATION** (resolved in research.md):
- Catalog endpoint shapes for Subject/Grade/Stream/Featured Content do not exist yet → landed as documented assumed shapes in `contracts/` with a "name the endpoint" follow-up; student landing ships with static-only fallback first.
- Contact Us delivery mechanism (form POST vs mailto vs static contact details) → resolved in research.md to a localized Server Action (zod-validated) that proxies to a backend contact endpoint, with mailto fallback when backend is absent.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution: `E:\projects\elemni_front_end\.specify\memory\constitution.md` (v1.0.0).

| # | Article | Status | Evidence / Plan |
|---|---------|--------|-----------------|
| I | Boundary — frontend renders rules, never owns them | ✅ PASS | Landing only displays Subject/Grade/Stream/Featured Content received from the API. No commission/tier/auth decisions on the landing. If an endpoint is missing, raise it (research.md) rather than fabricate client-side. |
| II | Contract enforcement at the boundary | ✅ PASS | Every catalog/contact response parsed with zod at the edge before use. Assumed shapes captured in `contracts/`; types inferred from schemas — never declared separately. `unknown` + parse; `any` banned. |
| III | RTL-first | ✅ PASS | `ar` default locale (already configured in `src/i18n/routing.ts`); `<html dir>` already set in `src/app/[locale]/layout.tsx`; Tailwind logical properties only; ESLint physical-utility ban enforced; direction-implying lucide icons mirrored; reviewed in both AR/EN. |
| IV | No client secrets — Next is the BFF | ✅ PASS | No `NEXT_PUBLIC_` API URLs; any contact/server proxy lives under `app/api/proxy/`; tokens httpOnly cookies only. Landing itself renders server-side with no token needs. |
| V | Honest claims — no simulated enforcement | ✅ PASS | No DRM/watermark/device-limit claims on the landing. No "success" rendered for contact submission until the API confirms. |
| VI | Motion budget | ✅ PASS | All animations `opacity`/`transform` only, gated by `motion-safe:`. Matches existing `hero.tsx`/`header.tsx` patterns. |
| VII | Server Components by default | ✅ PASS | Landing page is an async Server Component (`setRequestLocale`); `"use client"` only where state/handlers needed (the existing `header.tsx` pattern). |
| VIII | Single API client | ✅ PASS | Catalog/contact calls go through `src/lib/api/` once backend exists. Until then, no `fetch` in components; static fallback only. |
| IX | Money is displayed, never computed | ✅ N/A | Landing does not price or compute; pricing tiers, if surfaced, arrive from API as integer piastres and rendered via `Intl.NumberFormat("ar-EG", currency:"EGP")`. (Out of v1 scope — see research.md.) |
| X | Explicit caching | ✅ PASS | Marketing copy = static/ISR; Subject/Grade/Stream catalog = `revalidate: 3600`, tag `curriculum` (per constitution example). Money/playback/token data = never cached. Decision per data class in research.md. |
| XI | Video & DRM reality | ✅ N/A | No video playback on the landing. Lesson preview thumbnails, if any, are static images via `next/image` with explicit dimensions. |
| XII | Server Actions are public endpoints | ✅ PASS | Contact Us submission (if a Server Action) gated first (`requireStudent()`/no-auth), zod-validated, scoped revalidation, errors mapped to typed codes — never raw API errors to client. |
| XIII | Contract testing | ✅ PASS | Every backend endpoint the landing consumes (Subject/Grade/Stream/Featured, Contact) ships a contract test asserting this repo's zod schemas against staging fixtures, run in CI. Mandatory before merge. |

**Gate result**: PASS — no violations requiring complexity justification.

## Project Structure

### Documentation (this feature)

```text
specs/001-student-landing-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (zod schemas for catalog/contact endpoints)
└── tasks.md             # Phase 2 output (NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── [locale]/
│       ├── (student)/                # NEW route group (org-only, no URL segment)
│       │   ├── layout.tsx            # optional thin layout if needed; else omitted
│       │   └── page.tsx              # NEW student landing (default root)
│       ├── teachers/                 # NEW real segment → /teachers, /en/teachers
│       │   └── page.tsx              # relocated teacher marketing landing
│       └── (marketing)/              # EXISTING teacher page — repurposed to student landing shape
│           └── page.tsx              # → moved into (student)/page.tsx; teacher content moved to /teachers
├── features/
│   ├── marketing/                    # EXISTING teacher-focused components (reused by /teachers)
│   │   └── components/                #  hero, header, footer, etc. (unchanged behavior)
│   └── student-landing/              # NEW feature-first module
│       ├── components/               # StudentHero, SubjectGrid, FeaturedLessons, ContactUs, etc.
│       ├── data.ts                   # static fallback content (no business rules)
│       └── schemas.ts                # zod schemas for catalog/contact responses (mirror of contracts/)
├── i18n/                              # EXISTING (routing.ts, navigation.ts, request.ts)
├── messages/
│   ├── ar.json                        # ADD studentLanding.*, teachers.* namespaces
│   └── en.json                        # ADD same keys
├── lib/
│   ├── api/                           # NEW (skeleton): single client wrapper for Subject/Grade/Stream/Contact
│   │   └── catalog.ts                # catalog fetch + zod parse + typed errors (server-only)
│   └── cn.ts                          # EXISTING

tests/                                 # NEW (scaffolded with first contract test)
├── contract/
│   └── catalog.contract.test.ts
└── e2e/                               # Playwright (later)
```

**Structure Decision**: Put the new student landing in a real organizational route group (`(student)/page.tsx`) under `[locale]/` so it resolves at the locale root (`/` for Arabic, `/en/for English`). Move the existing teacher marketing page from `(marketing)/page.tsx` to a real `teachers/` segment (`/teachers`, `/en/teachers`). Route groups carry no URL segment; `teachers/` is a real folder so it produces the distinct path. i18n middleware already covers all non-`api/_next` paths, so both routes get locale-prefixed per next-intl `as-needed` rules automatically.

## Complexity Tracking

> Not filled — Constitution Check passed with no violations to justify.

## Post-Design Constitution Re-Check (Phase 1 complete)

Re-evaluated against the design artifacts (`research.md`, `data-model.md`,
`contracts/`, `quickstart.md`). No article changes status:

- I (Boundary): confirmed — schemas in `contracts/` are boundary parsers, not
  client-side rules; lessonsCount/featuredOrder are read straight from the API.
- II (Contract): confirmed — zod schemas defined for every consumed endpoint;
  types inferred via `z.infer`; `any` absent; `unknown`+parse pattern applied.
- III (RTL-first): confirmed — design keeps `ar` default, `<html dir>` set,
  logical properties, mirrored lucide icons; quickstart V2 verifies.
- IV (No client secrets): confirmed — no auth in v1; BFF proxy deferred
  (research.md R4); env `API_URL` server-only.
- V (Honest claims): confirmed — contact flow never fakes success; `mailto:`
  fallback replaces the form when backend is absent.
- VI, VII, VIII, X, XII, XIII: confirmed — design choices recorded in
  research.md R3/R7/R5 and contracts/contact.zod.md.

**Gate result (post-design)**: PASS — no violations to justify.