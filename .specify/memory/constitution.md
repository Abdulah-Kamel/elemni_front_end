<!--
SYNC IMPACT REPORT
==================
Version change: (template / unversioned) → 1.0.0
Bump rationale: MAJOR — first ratification. Establishes the full governing
principle set by converting the existing CLAUDE.md engineering charter into
binding constitutional articles. No prior version to compare against.

Modified principles: N/A (initial adoption).

Added sections:
  - Core Principles I–XIII (BOUNDARY, CONTRACT, RTL-FIRST, NO CLIENT SECRETS,
    HONEST CLAIMS, MOTION BUDGET, plus Server Components, The Single API Client,
    Server Actions, Money, Caching, Video & DRM, Contract Testing)
  - Additional Constraints (i18n/RTL detail, Performance, Directory Structure,
    Conventions)
  - Development Workflow & Quality Gates
  - Governance

Removed sections: None.

Templates requiring updates:
  - .specify/templates/plan-template.md ✅ reviewed — generic "Constitution
    Check" gate; no hardcoded conflicting principles. Fill from this file per run.
  - .specify/templates/spec-template.md ✅ reviewed — no conflict; success
    criteria remain technology-agnostic as required.
  - .specify/templates/tasks-template.md ✅ reviewed — "Tests are OPTIONAL"
    note is scoped by spec; Article XIII makes contract tests MANDATORY for any
    new endpoint integration. Enforced at spec/plan time, not by template edit.
  - Spec Kit skill files (.claude/skills/speckit-*) ✅ reviewed — no
    agent-specific (CLAUDE-only) references requiring genericization.

Follow-up TODOs: None. RATIFICATION_DATE set to today (first formal adoption
of the pre-existing charter).
-->

# Elemni Web Constitution

Frontend for Elemni, an LMS for Egyptian teachers. Teachers upload video lessons,
organize them by subject/grade/stream, protect them with DRM, and sell them to
students via subscription tiers + per-transaction commission. **This repo is the
frontend only.** All business logic, persistence, payments, DRM licensing, and
video processing live behind a separate backend API.

Stack: Next.js 16 (App Router) · TypeScript strict · Tailwind v4 · next-intl
(AR/EN, RTL-first) · React 19.

This document supersedes ad-hoc convention. Every principle below is a
non-negotiable. Where a principle says MUST or MUST NOT, a violation blocks
merge.

## Core Principles

### I. The Boundary — Frontend Renders Rules, Never Owns Them (NON-NEGOTIABLE)

This repo owns rendering, routing, i18n/RTL, form UX, client state, optimistic
UI, accessibility, performance, and being a trustworthy proxy for the browser.
It does NOT own business rules, authorization decisions, money math, DRM policy,
or the source of truth for anything.

- The frontend MAY *display* a rule the API tells it about. It MUST NEVER *be*
  the rule.
- Any commission calculation, tier-limit check, payout total, or authorization
  decision written in this repo is a violation — even when it produces the
  right number today.
- If a task appears to require business logic here, STOP and say so. It is
  almost always a missing API endpoint; name the endpoint and its shape rather
  than working around it with client-side stitching.

**Rationale**: Duplicating a backend rule here creates two implementations that
will disagree, and the one users can read in a JS bundle is not the
authoritative one. This is the single most important article.

### II. Contract Enforcement at the Boundary (NON-NEGOTIABLE)

Every API response MUST be zod-parsed at the boundary before any use. The API
is a separate deploy on a separate release cycle; its contract *will* drift from
your types.

- `zod` at the edge, typed domain objects inside. One zod schema per feature is
  the source of truth; infer TS types from it — never declare both.
- If the API ships an OpenAPI schema, generate types from it in CI and fail the
  build on drift. Still zod-parse at runtime: generated types describe the
  contract, not what the server actually sent today. If there is no OpenAPI
  spec, ask for one.
- `any` is banned. `unknown` + a parse is the answer.

**Rationale**: A backend deploy that changes a shape must surface as a caught
parse error at a known location, not as an undefined-access crash three
components deep.

### III. RTL-First (NON-NEGOTIABLE)

Arabic RTL is the default, not a feature flag. `ar` is the default locale.

- Physical direction utilities are BANNED: `ml-`/`mr-`/`pl-`/`pr-`,
  `left-`/`right-`, `text-left`/`text-right`, and any other physical-direction
  class. Use Tailwind logical properties only: `ms`/`me`, `ps`/`pe`,
  `start`/`end`, `text-start`/`text-end`.
- This ban MUST be enforced by an ESLint rule, not by review discipline.
- `<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>`.
- Direction-implying icons (arrows, chevrons) MUST mirror.
- Every UI PR MUST be checked in both directions before merge.

**Rationale**: Egyptian teachers use Arabic first. Physical utilities silently
break RTL; only tooling, not vigilance, keeps them out.

### IV. No Client Secrets — Next Is the BFF (NON-NEGOTIABLE)

Tokens MUST NEVER touch client-readable storage: httpOnly, Secure, SameSite
cookies only. No `localStorage`, no `sessionStorage`, no tokens in Redux, no
tokens in a `NEXT_PUBLIC_` var.

- The browser MUST NEVER call the API directly for anything authenticated. It
  calls Next; Next calls the API.
  - Reads: Server Components call the API server-side with the session.
  - Mutations: Server Actions call the API server-side.
  - Client-side interactive reads (search-as-you-type, polling, infinite
    scroll): call a Next route handler under `app/api/proxy/`, which attaches
    credentials server-side and forwards.
- `app/api/` exists ONLY for this BFF role: read session → forward → return. A
  route handler that decides something is business logic in the wrong repo.
- The API client module MUST carry `import "server-only"` so a leaked import
  into a client bundle becomes a build error, not an exposed token.

**Rationale**: A bearer token attachable by client JS is readable by any XSS.
The BFF keeps credentials on the server origin.

### V. Honest Claims — No Simulated Enforcement (NON-NEGOTIABLE)

The UI MUST NEVER simulate an enforcement it cannot actually perform.

- No CSS-overlay "watermarks". Forensic watermarking is server-side (per-session
  transcode or provider feature); a name-in-a-div is removed with devtools in
  ten seconds and MUST NOT be shipped and called a watermark.
- No client-side device limits. Device limits are enforced at license issuance,
  server-side; a client-side check is theater.
- No success state the API has not confirmed. Never render "success" for money,
  upload, or any operation the API hasn't acknowledged.
- License acquisition (Widevine/FairPlay) is browser → license server; this app
  configures the player, it does not decide policy.
- Screen recording cannot be fully blocked on Android or desktop browsers. If
  marketing copy claims otherwise, the copy is the bug — fix the landing page.

**Rationale**: Faking enforcement converts a product gap into a trust incident.
If the API can't back a claim, the claim comes down.

### VI. Motion Budget (NON-NEGOTIABLE)

Animations MUST use `opacity` and `transform` only, and MUST always be gated
behind the `motion-safe:` prefix. No animating layout, color, box-shadow,
width/height, or other properties that trigger layout or paint on the main
thread.

- Target is 3G Egyptian mobile, not a laptop. Motion that costs a reflow is a
  jank source on the devices users actually hold.
- `motion-safe:` is mandatory so users with `prefers-reduced-motion` get a still
  interface.

**Rationale**: `opacity`/`transform` are GPU-compositable and cheap; everything
else risks dropped frames on constrained hardware.

### VII. Server Components by Default

Server Components are the default. `"use client"` needs a concrete reason:
state, effects, event handlers, or browser APIs — and MUST be pushed as far down
the tree as possible.

- Ship no client JS for content that doesn't need it.
- `dynamic()`-import the video player, charts, and any rich editor; they MUST
  NOT land in the shared chunk.

**Rationale**: Client JS is the most expensive thing to ship to a 3G user.

### VIII. The Single API Client

No `fetch()` to the API scattered in components. Everything goes through
`src/lib/api/`. One place knows the base URL, auth, retries, errors, and tracing.

- Every call MUST have a timeout (`AbortSignal.timeout()`). A hung API must not
  hang a Server Component render.
- Retry idempotent GETs only, with backoff. NEVER auto-retry a POST — that is
  how a student gets charged twice.
- Forward `Accept-Language` so the API returns localized errors. Forward a
  request ID for cross-boundary tracing.
- Map API errors to a typed taxonomy — `Unauthorized`, `Forbidden`, `NotFound`,
  `Validation`, `RateLimited`, `Conflict`, `Upstream`. Components branch on the
  type, NEVER on a status number or a message string. A raw throw is never
  surfaced.

**Rationale**: One wrapper is the only place the frontend/backend boundary is
correctly and consistently crossed.

### IX. Money Is Displayed, Never Computed (NON-NEGOTIABLE)

This frontend displays money; it never computes it. (This is the money-specific
face of Article I.)

- Amounts arrive as integer piastres. Format for display with
  `Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" })`. Never
  parse to float, never do arithmetic.
- Commission rates, payout totals, and tier limits MUST be rendered from the API
  response, never calculated locally.
- Checkout is NEVER optimistic. Show a pending state; poll or subscribe for API
  confirmation. Fawry and wallet flows are asynchronous and can take minutes.
- Anything with money in it is NEVER cached.

**Rationale**: A rounding or rate bug in a React component is a real financial
defect. The API is the only place money math is allowed to happen.

### X. Explicit Caching

Caching MUST be explicit per data class; Next's defaults shift between versions
and MUST NOT be relied upon.

- Marketing/pricing: static, ISR. Curriculum tree: `revalidate: 3600`, tag
  `curriculum`. Teacher dashboard: dynamic, tag `lessons:${teacherId}`. Student
  enrollments: dynamic, tag `enrollments:${studentId}`. Video playback URLs / DRM
  tokens: NEVER cached. Anything with money: NEVER cached.
- Cache tags MUST be scoped per-entity. A broad `lessons` tag means one teacher's
  upload revalidates every teacher's dashboard.
- Cache invalidation spans two systems. For any state the backend can change
  independently (webhook, admin action, background job), either keep TTLs short
  or obtain a revalidation webhook from the API team. Decide deliberately — do
  not discover it in production.

**Rationale**: Stale money or stale playback tokens are correctness and security
problems, not cosmetic ones.

### XI. Video Playback & DRM Reality

This repo integrates a player. It does not process, store, or protect video.

- Upload: request a presigned URL from the API, then upload direct from browser
  to storage. Bytes NEVER pass through Next. Show real progress; handle resume.
- Lesson status is an API state machine: `uploading → processing → ready |
  failed`. Render EVERY state explicitly. There is no "assume it worked."
- Playback: fetch a short-lived signed URL per session, server-side, uncached.
  NEVER render a playback URL into static HTML.
- All DRM enforcement claims are governed by Article V.

**Rationale**: Video is the product's core asset and its core liability;
half-rendered states and leaked URLs are the two classic failures.

### XII. Server Actions Are Public Endpoints

Server Actions are public HTTP endpoints. Anyone can call them with any payload;
they are not "internal functions."

- Gate first (`requireTeacher()`/`requireStudent()`) — this is a UX gate, NOT
  security. Assume the check doesn't exist; the API authorizes independently.
- Shape-validate input with zod for fast feedback, NOT trust. The API
  revalidates everything.
- Invalidate with a correctly scoped `revalidateTag` after a mutation.
- NEVER return raw API errors to the client. Map to typed codes; the UI renders
  a localized, actionable message.

**Rationale**: Treating an action as trusted internal code is how an
unauthorized mutation ships.

### XIII. Contract Testing (NON-NEGOTIABLE)

Any new endpoint integration MUST ship with a contract test that asserts this
repo's zod schemas against the API's real staging response fixtures, run in CI
against the live staging API.

- This is the test that catches a backend deploy breaking the frontend; it is
  mandatory, not optional, for every endpoint this frontend consumes.
- Additional test discipline (intended stack: Vitest · MSW · Playwright):
  - Vitest units for formatters, RTL helpers, zod schemas, error mapping.
  - MSW mocks at the network layer — NEVER stub your own client; the parse and
    error paths must be under test too.
  - Playwright for critical paths (signup → upload → enroll → pay → play) in
    both AR and EN.
  - Test failure states explicitly: API down, 401 mid-session, slow network,
    failed upload. In a split architecture these are Tuesday, not edge cases.

**Rationale**: The frontend and API deploy independently; the contract test is
the only automated tripwire on the boundary drift described in Article II.

## Additional Constraints

### i18n & RTL Detail

- `next-intl`, locale segment `[locale]`, `ar` default. No hardcoded user-facing
  strings — everything through `next-intl`, in both `ar` and `en`.
- Fonts: Cairo (AR), Inter/Poppins (EN) via `next/font`, `display: swap`,
  subset. Arabic webfonts are heavy.
- Arabic-Indic numerals in UI via `Intl.NumberFormat("ar-EG")`; Latin digits in
  IDs, URLs, and code.
- Errors that reach a user MUST be localized and actionable in both languages.
  "Something went wrong" is not acceptable copy.

### Performance

Budget for 3G, not a laptop.

- `next/image` everywhere with explicit dimensions; no CLS.
- If a route's client bundle crosses ~150KB gzipped, justify it in the PR.
- Server Components mean API latency is render latency: parallelize independent
  fetches (`Promise.all`) and use `<Suspense>` with real skeletons.
- NEVER waterfall: a child fetch that depends on a parent fetch is a round-trip
  paid twice.

### Directory Structure & Conventions

- Feature-first, not type-first. No top-level `components/`, `hooks/`, `utils/`
  dumping grounds. Used by one feature → lives in that feature; promote to
  shared on the third usage, not the second. New feature → new folder in
  `src/features/`. `app/` is routing only and stays thin.
- Files `kebab-case.ts`; components `PascalCase`.
- No barrel files (`index.ts` re-exports) — they break tree-shaking and create
  cycles.
- Env validated with zod in `src/env.ts`; the app refuses to boot on a missing
  var. `API_URL` is server-only — NEVER `NEXT_PUBLIC_`.

### Framework Currency

This is Next.js 16.2.10 with React 19; APIs differ from older training data.
Read the bundled guides in `node_modules/next/dist/docs/` before writing
Next.js code, and heed deprecation notices. The repo is currently a fresh
Create Next App; the structure above is the spec to build toward, not a map of
files that exist — verify a path before citing it.

## Development Workflow & Quality Gates

- `npm run build` is the real typecheck + lint gate (`tsc` runs via `next
  build`; `tsconfig.json` is `strict`). `npm run lint` is the ESLint flat
  config (core-web-vitals + typescript), including the physical-utility ban of
  Article III.
- Read the existing feature module before adding to it; match its patterns.
- Anything touching auth, money, or DRM MUST explain the flow across both
  systems before code is written.
- If a requirement conflicts with this constitution, RAISE it — do not quietly
  route around it. If the API is missing something, name the endpoint and its
  shape rather than stitching client-side.
- Every UI change is reviewed in both AR and EN before merge (Article III).

## Governance

This constitution supersedes all other practices and conventions in this repo.
Where it conflicts with habit, expedience, or a copied pattern, the constitution
wins.

- **Amendments** require: a written change to this file, a version bump per the
  policy below, an updated Sync Impact Report, and propagation to any dependent
  Spec Kit templates (`plan-template.md`, `spec-template.md`,
  `tasks-template.md`) and guidance docs.
- **Versioning policy** (semantic):
  - MAJOR — backward-incompatible governance/principle removal or redefinition.
  - MINOR — a new principle/section added or materially expanded guidance.
  - PATCH — clarifications, wording, and non-semantic refinements.
- **Compliance review**: every PR and review MUST verify compliance with the
  applicable principles. The `Constitution Check` gate in the plan template is
  filled from this file each run and MUST pass before Phase 0 research and be
  re-checked after Phase 1 design. Any complexity that violates a principle MUST
  be justified in the plan's Complexity Tracking table or the design changes.
- **Runtime guidance**: `CLAUDE.md` / `AGENTS.md` remain the day-to-day
  development guidance for agents; they MUST stay consistent with this
  constitution, which is the authority if they diverge.

**Version**: 1.0.0 | **Ratified**: 2026-07-16 | **Last Amended**: 2026-07-16
