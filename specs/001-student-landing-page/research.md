# Phase 0 Research: Student Landing Page (Default)

**Branch**: `001-student-landing-page` | **Date**: 2026-07-17

This document resolves the NEEDS CLARIFICATION items from the plan's Technical
Context and the spec's open delivery-mechanism question. Research sources: the
bundled Next.js 16 docs at `node_modules/next/dist/docs/`, the existing codebase
under `E:\projects\elemni_front_end\src\`, and the constitution at
`.specify/memory/constitution.md` (v1.0.0).

---

## R1. Two coexisting landings — route group vs nested folder

**Decision**: Keep the student landing at the locale root via an organizational
route group `src/app/[locale]/(student)/page.tsx`, and move the teacher marketing
page to a **real nested folder** `src/app/[locale]/teachers/page.tsx`.

**Rationale**: Route groups (parenthesized) carry no URL segment — they exist
only to organize shared layouts. A real folder `teachers/` produces the segment
`/teachers`, which is the distinct, non-root location the spec requires.
`generateStaticParams` already iterates `routing.locales` so both routes render
for every locale; next-intl middleware already matches everything except
`api/_next/_vercel`.

**Alternatives considered**:
- Route group `(teachers)/page.tsx` — rejected: it would NOT add a URL segment,
  so the teacher page would collide with the root student landing.
- Separate subdomain (`teachers.elemni…`) — rejected: requires DNS/host header
  config and middleware host-rewriting; the spec allowed "page or subdomain"
  and a distinct path is simpler, fully within the repo, and trivially
  linkable from the footer.

**Source**: `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md:43-130`;
`src/i18n/routing.ts:3-7`; `src/app/[locale]/layout.tsx:20-22`.

---

## R2. next-intl prefix behavior for the new `/teachers` path

**Decision**: The teacher landing is served at `/teachers` (Arabic default, no
prefix) and `/en/teachers` (English, prefixed). The student landing is served
at `/` (Arabic, no prefix) and `/en` (English, prefixed).

**Rationale**: `routing.ts` uses `localePrefix: "as-needed"` with `defaultLocale:
"ar"`, so the default locale omits its prefix and non-default locales emit it.
The existing middleware matcher `/((?!api|_next|_vercel|.*\\..*).*)` already
covers `/teachers`, so no middleware change is required.

**Alternatives considered**: `localePrefix: "always"` — rejected: it changes the
default-locale URLs across the whole app and breaks the constitution's
"Arabic default at root" intent. `localePrefix: "never"` — rejected: loses the
English-language URL signal.

**Source**: `src/i18n/routing.ts:3-7`; `src/middleware.ts:6-8`;
`node_modules/next/dist/docs/01-app/02-guides/internationalization.md:70-92`.

---

## R3. Catalog data fetching, timeout, parallelization, fallback

**Decision**: Fetch Subject/Grade/Stream/Featured Content directly in async
Server Components using `Promise.allSettled` for independent requests; wrap each
dynamic section in `<Suspense>` with skeleton fallbacks; segment-level
`error.tsx` for catastrophic failures; inline conditional rendering of static
fallback content when a request rejects. Once `src/lib/api/` exists, each call
goes through it with `AbortSignal.timeout()` and typed error mapping.

**Rationale**: The bundled docs explicitly recommend `Promise.all` for
parallelizing independent fetches and `Promise.allSettled` to tolerate
individual failures; they recommend `<Suspense>` + `loading.tsx` for streaming
so the static shell paints instantly while catalog data streams in; and
`error.tsx` (Client Component with `unstable_retry`) for uncaught failures. The
constitution's Article VIII requires every call to have a timeout and mapping to
a typed error taxonomy; `AbortSignal.timeout()` is the implementation choice for
that. Article X requires explicit per-class caching (catalog = `revalidate: 3600`,
tag `curriculum`; money/playback tokens = never cached).

**Alternatives considered**:
- Route Handler → `fetch` from client — rejected: Article IV forbids
  client-direct authenticated calls; the bundled BFF guide says do not use
  Route Handlers for Server Component data fetching.
- Single `Promise.all` that rejects on any failure — rejected: loses all
  content if one catalog list 500s; `Promise.allSettled` preserves the others.
- Hard `loading.tsx` only (whole-segment Suspense) — rejected: a whole-page
  loader delays the static marketing shell; per-section Suspense keeps the
  hero and CTAs instant.

**Source**:
`node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md:22-100,119-198,471-539`;
`node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md:119-271`;
constitution Articles VIII and X.

---

## R4. BFF / proxy pattern (informational; not implemented this feature)

**Decision**: Defer. The student landing v1 ships with static fallback content
and NO authenticated backend calls. A future BFF proxy, if needed, will live at
`src/app/api/proxy/[...slug]/route.ts`, attach server-side credentials from
`process.env` (never `NEXT_PUBLIC_`), and forward the response. Server
Components will keep using the single API client in `src/lib/api/` directly for
server-side reads (per the bundled BFF guide, Route Handlers are not the path
for Server Component data fetching).

**Rationale**: The landing needs no authenticated reads (Subject/Grade/Stream
catalog is public browse data). Article IV mandates the BFF pattern only for
authenticated calls. Wiring a proxy now would be speculative work and a
violation of "name the endpoint, don't stitch client-side."

**Alternatives considered**: Build the proxy skeleton now — rejected: no
consuming auth flow exists yet; speculative scaffolding risks violating
Article IV's "app/api/ exists ONLY for this BFF role."

**Source**:
`node_modules/next/dist/docs/01-app/02-guides/backend-for-frontend.md:443-499,772-896`;
constitution Article IV.

---

## R5. Contact Us delivery mechanism

**Decision**: A localized Server Action `submitContact`, zod-validated, that
proxies to a backend contact endpoint via `src/lib/api/contact.ts`. The form
renders inside the student landing footer/bottom "Contact Us" section. Until the
backend contact endpoint exists, the section renders a `mailto:` link with the
platform's contact email plus optional static contact details — and the form
itself is NOT shown (no fake success per Article V).

**Rationale**: Article V forbids rendering a success state the API has not
confirmed, so a form-without-backend that fakes success is illegal. Article XII
treats Server Actions as public endpoints — `zod` validation is for fast
feedback, NOT trust; the backend revalidates. Article II requires the response
to be zod-parsed before use. Albeit the contact flow is unauthenticated, it
still routes through `src/lib/api/` for one-place error mapping. The mailto
fallback keeps FR-012 satisfied (a no-sign-in-required contact path) in v1.

**Alternatives considered**:
- Pure mailto only (no form ever) — rejected as the long-term path: the
  product wants form submissions eventually, so the spec captures that path.
  Acceptable as the v1 fallback only.
- `next/link` `mailto:` only and never a form — partial; fine for v1.
- WebSocket/polling — rejected: over-engineered for a contact form.

**Source**: constitution Articles II, V, XII;
`node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
(Server Actions overview).

---

## R6. Localized per-page metadata

**Decision**: Use `generateMetadata({ params })` in each `page.tsx`, await the
locale param, use `getTranslations` to read localized title/description from
`messages/<locale>.json`, and return a `Promise<Metadata>`. Mirror localized
OG/CAN areas under separate namespaces (`studentLanding.meta`, `teachers.meta`).

**Rationale**: The bundled metadata doc requires metadata on Server Components
and supports async `generateMetadata` that can fetch translations. next-intl
makes `getTranslations` available in server code; running metadata separately
from the page render avoids duplicate fetches. Bots wait for metadata; users
get the streamed page — both correct.

**Alternatives considered**: Static `metadata` export — rejected: not
localized. Client-side `next/head` — rejected: not an API in App Router.

**Source**:
`node_modules/next/dist/docs/01-app/01-getting-started/14-metadata-and-og-images.md:27-157`;
`src/messages/ar.json:1-15` (existing namespace pattern).

---

## R7. Caching strategy for the student landing

**Decision**: Route segment config `export const revalidate = 3600;` on the
student landing for the catalog-fetched sections; `fetch(..., { next: { tags:
["curriculum"] } })` per call so a backend webhook can call `revalidateTag(
"curriculum")` when the catalog changes. Pure marketing copy stays static (no
fetch, fully ISR-by-default). Anything money or DRM-related — not present in v1
— would be `cache: 'no-store'` if added later.

**Rationale**: Article X mandates explicit caching decisions per data class and
prefers tag-based revalidation over `revalidatePath`. The bundled "caching
without cache components" guide confirms that, in the project's current config
(no `cacheComponents`), `fetch` is not cached by default, so explicit `revalidate`
and tags are required for the catalog. Mixing a static marketing shell with a
catalog-fetched component is best served by per-section `<Suspense>` so the static
parts paint instantly.

**Alternatives considered**:
- `revalidatePath("/teachers")` on every backend change — rejected: tag-based
  is more precise, avoids cross-teacher invalidation (Article X warns about
  broad tags).
- `cache: 'force-cache'` with no tags — rejected: no invalidation path when the
  catalog changes; stale catalogs fail students.
- Default (no config) — rejected: Article X explicitly says the repo MUST NOT
  rely on framework defaults.

**Source**:
`node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md:9-196`;
`node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md:165-187`;
constitution Article X.

---

## R8. Catalog endpoint shapes (named, not built)

**Decision**: Document the assumed shapes in `contracts/subject.zod.md`,
`contracts/grade.zod.md`, `contracts/stream.zod.md`,
`contracts/featured-content.zod.md`, and `contracts/contact.zod.md`. Treat these
as "name the endpoint and its shape" requests to the backend team. The student
landing v1 renders static fallback content; the schemas are wired but the fetch
is gated behind an env flag / feature toggle so the page never crashes when the
endpoint is absent.

**Rationale**: Articles I and II: when an endpoint is missing, name it and its
shape rather than fabricating data client-side. The schemas let CI contract tests
fail loudly the moment staging serves a shape that drifts.

**Alternatives considered**:
- Build the endpoints here — rejected: this repo is frontend-only (Article I).
- Skip schemas entirely until backend lands — rejected: Article XIII makes
  contract tests mandatory at integration time; defining the schemas now is
  the deliverable that unblocks those tests.

**Source**: constitution Articles I, II, XIII; existing feature module at
`src/features/marketing/`.

---

## Summary

All NEEDS CLARIFICATION items resolved:
- R1 routing layout ✅
- R2 localized prefixes ✅
- R3 fetching + fallback ✅
- R4 BFF deferred ✅
- R5 Contact Us mechanism ✅
- R6 localized metadata ✅
- R7 caching ✅
- R8 endpoint shapes named ✅

Phase 1 may proceed.