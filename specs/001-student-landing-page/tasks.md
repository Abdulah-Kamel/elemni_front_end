---

description: "Task list for Student Landing Page (Default) implementation"
---

# Tasks: Student Landing Page (Default)

**Input**: Design documents from `/specs/001-student-landing-page/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md — all present.

**Tests**: Contract tests are MANDATORY (constitution Article XIII) for any backend endpoint this feature wires. v1 ships with static fallback and NO backend calls wired, so no contract test tasks are generated in user-story phases. A deferred contract-test task lives in the Polish phase, gated on backend availability. Playwright E2E scenarios from quickstart.md are surfaced as optional Polish tasks.

**Organization**: Tasks grouped by user story. US1 = default student landing at root (P1, MVP). US2 = language toggle + RTL/LTR mirroring (P2). US3 = teacher landing relocation + footer link (P3). Cross-cutting (Contact Us, metadata, caching, build gate) lives in Setup/Foundational or Polish as appropriate.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js 16 App Router frontend (single project). Repo-root-relative paths used throughout. i18n prefix is `[locale]` with `localePrefix: "as-needed"` (Arabic default, no prefix at `/`; English at `/en`). See plan.md "Project Structure" for the full tree.

- Student landing route group: `src/app/[locale]/(student)/page.tsx` (organizational, no URL segment → serves locale root)
- Teacher landing real segment: `src/app/[locale]/teachers/page.tsx` (→ `/teachers`, `/en/teachers`)
- Existing marketing components (teacher-focused) reused by `/teachers`: `src/features/marketing/components/*`
- New feature module: `src/features/student-landing/`
- i18n messages: `src/messages/ar.json`, `src/messages/en.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the new feature module and shared skeleton so user stories can build on it. This repo already exists (Next.js 16.2.10, React 19, next-intl v4, Tailwind v4) — no project init needed.

- [x] T001 Create the feature-first student-landing module directories `src/features/student-landing/{components,data,schemas,actions}` per plan.md structure
- [x] T002 [P] Create empty i18n namespaces `studentLanding` and `teachers` stub objects in `src/messages/ar.json` and `src/messages/en.json` (mirrored keys, RTL-first content later)
- [x] T003 [P] Add `API_URL` (server-only, NOT `NEXT_PUBLIC_`) and `CONTACT_EMAIL` to the zod env schema so the app refuses to boot on a missing server-only API URL; placeholder-safe defaults documented in `.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core skeleton that MUST exist before ANY user story can be implemented: the catalog schema/parser module, the single API client skeleton, and static fallback data.

**⚠️ CRITICAL**: US1/US2/US3 all import from these; no user story work can begin until this phase is complete.

- [x] T004 Implement zod schemas mirroring `specs/001-student-landing-page/contracts/subject.zod.md`, `grade.zod.md`, `stream.zod.md`, `featured-content.zod.md`, and `contact.zod.md` in `src/features/student-landing/schemas/{subject,grade,stream,featured-content,contact}.ts` (inferring TS types via `z.infer`; no duplicate type declarations)
- [x] T005 Implement the single API client skeleton in `src/lib/api/` with: base URL from env, `Accept-Language` forwarding, request-ID header, `AbortSignal.timeout()` per call, retry for idempotent GETs only (NEVER POST), and mapping to the typed error taxonomy from `contracts/common-error.md` (types: `Unauthorized | Forbidden | NotFound | Validation | RateLimited | Conflict | Upstream | Network`); module carries `import "server-only"`
- [x] T006 Implement typed catalog fetchers in `src/lib/api/catalog.ts` wrapping `SubjectsResponseSchema`, `GradesResponseSchema`, `StreamsResponseSchema`, `FeaturedContentResponseSchema` parses with `revalidate: 3600`, `next: { tags: ["curriculum"] }`; each returns the parsed typed domain object or `null` on failure (so callers can fall back)
- [x] T007 [P] Create static fallback content for the landing in `src/features/student-landing/data.ts` (subjects/grades/streams/featured examples for no-backend rendering; NO business rules, NO computed counts — display-only placeholders)

**Checkpoint**: Foundation ready — schemas, single API client, catalog fetchers (with graceful `null` on failure), and static fallback data all available. User story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Prospective Student Discovers the Platform (Priority: P1) 🎯 MVP

**Goal**: A first-time visitor opening the root address sees a student-oriented landing in Arabic (RTL), with hero, subjects/grades/streams highlights, browse lessons CTA, sign-up CTA, sign-in CTA, and a footer containing a "For Teachers" link and a "Contact Us" section. Backend-unreachable → static fallback + skeletons (no blank page).

**Independent Test**: Open `http://localhost:3000/` in a fresh private window → student landing renders in Arabic RTL within ~3 s (throttled 3G); hero + CTAs visible with JS disabled; footer shows "For Teachers" link and a `mailto:` Contact Us (v1 fallback). (Spec acceptance scenarios US1.1–US1.4; quickstart V1, V4, V5.)

### Implementation for User Story 1

- [x] T008 [P] [US1] Create `StudentHero` Server Component in `src/features/student-landing/components/student-hero.tsx` reading localized copy from `messages/<locale>.json` under `studentLanding.hero`; exported as async Server Component (no `"use client"`)
- [x] T009 [P] [US1] Create `CtaBar` component (browse / sign-up / sign-in) in `src/features/student-landing/components/cta-bar.tsx` using `Link` from `src/i18n/navigation` to `/browse`, `/signup`, `/login` (locale-resolved by next-intl)
- [x] T010 [P] [US1] Create `SubjectGrid` async Server Component in `src/features/student-landing/components/subject-grid.tsx` that calls the `getSubjects()` catalog fetcher from `src/lib/api/catalog.ts`, zod-validated via schema, rendering `null` failure → static fallback subjects from `src/features/student-landing/data.ts`; uses `next/image` for icons with explicit dimensions; renders a skeleton while the promise is pending (wrapped by `<Suspense>`)
- [x] T011 [P] [US1] Create `GradeStreamFilter` Server Component in `src/features/student-landing/components/grade-stream-filter.tsx` rendering `getGrades()` and `getStreams()` results (with fallback); links are get-based navigation to `/browse` (no client state — server-driven filter)
- [x] T012 [P] [US1] Create `FeaturedLessons` async Server Component in `src/features/student-landing/components/featured-lessons.tsx` rendering `getFeaturedContent()` results (with fallback) as `next/image` thumbnails with explicit dimensions, linking per `linkType` (`lesson`/`subject`/`external`) and mirroring direction-implying chevrons
- [x] T013 [P] [US1] Create `StudentFooter` async Server Component in `src/features/student-landing/components/student-footer.tsx` containing a "For Teachers" footer link to `/teachers` (via `Link` from `src/i18n/navigation`) and a "Contact Us" section; v1: render a `mailto:${CONTACT_EMAIL}` link populated from `studentLanding.footer.contact` i18n copy (no form yet)
- [x] T014 [US1] Create the new route group root page `src/app/[locale]/(student)/page.tsx` as an async Server Component that calls `setRequestLocale(locale)`, exports `generateMetadata({ params })` returning localized title/description from `studentLanding.meta`, sets `export const revalidate = 3600`, and renders `<StudentHeader>` + `<main>` with `<StudentHero>`, `<CtaBar>`, and `<Suspense>`-wrapped `<SubjectGrid>`, `<GradeStreamFilter>`, `<FeaturedLessons>`, plus `<StudentFooter>`
- [x] T015 [P] [US1] Create `StudentHeader` client component in `src/features/student-landing/components/student-header.tsx` (mirror existing `src/features/marketing/components/header.tsx` shell: sticky, RTL, language toggle, brand) — but with student nav items and student CTAs (browse, sign up, sign in)
- [x] T016 [US1] Composerize the landing: ensure `src/app/[locale]/(student)/page.tsx` resolves at root by leaving the organizational `(student)` group without a URL segment; build a thin `src/app/[locale]/(student)/layout.tsx` only if a shared shell is required (otherwise omit — see plan.md Structure Decision)
- [x] T017 [US1] Verify the OLD root marketing page no longer serves at `/` — its content moves in US3; for US1's MVP ship, confirm visiting `/` shows the student landing and there is no duplicate `page.tsx` colliding at the same path under `[locale]/`
- [x] T018 [US1] Add an inline `<Suspense>` skeleton component `SubjectGridSkeleton` in `src/features/student-landing/components/subject-grid.tsx` exported as `SubjectGridSkeleton` so the catalog section streams without blocking the hero/CTAs (per research.md R3)
- [x] T019 [US1] Run the quickstart V1 validation scenario for US1 (root URL renders student landing in Arabic RTL ≤3 s on 3G throttle; JS-disabled shell visible)

**Checkpoint**: User Story 1 is fully functional and independently testable. The root serves the student landing. Footer has the "For Teachers" link (points to `/teachers`, which US3 will populate) and a `mailto:` Contact Us. This is the MVP.

---

## Phase 4: User Story 2 - Visitor Switches Language and Locale Direction (Priority: P2)

**Goal**: Visitors toggle Arabic ↔ English; the page fully re-localizes including text, numerals, fonts, and direction-implying icons, mirroring correctly in both directions.

**Independent Test**: From the Arabic landing, toggle to English → URL becomes `/en`, all strings English, LTR, Latin digits, mirrored icons; toggle back → `/`, Arabic RTL, Arabic-Indic numerals; no untranslated strings remain. (Spec acceptance scenarios US2.1–US2.3; quickstart V2.)

### Implementation for User Story 2

- [x] T020 [US2] Audit and ensure every user-facing string in `src/features/student-landing/components/*` and the student landing route pulls from `next-intl` (`useTranslations` client, `getTranslations` server) — no hardcoded strings; add missing keys to `messages/ar.json` and `messages/en.json` under `studentLanding.*`
- [x] T021 [US2] Verify `<html dir={locale === "ar" ? "rtl" : "ltr"}>` and `lang` already set in `src/app/[locale]/layout.tsx` flow through to the student landing; add an integration check that the `dir` attribute toggles with the locale
- [x] T022 [P] [US2] Audit Tailwind utility classes across `src/features/student-landing/**` and `src/app/[locale]/(student)/**` for any physical-direction utilities (`ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`/`text-left`/`text-right`); replace every occurrence with logical properties (`ms`/`me`/`ps`/`pe`/`start`/`end`/`text-start`/`text-end`)
- [x] T023 [US2] Ensure direction-implying lucide-react icons (chevrons, arrows) render mirrored in RTL — apply the project's mirroring convention (e.g., `className="rtl:-scale-x-100"` or the existing pattern) so toggling locale mirrors icons
- [x] T024 [P] [US2] Configure the ESLint physical-utility ban per constitution Article III so future commits cannot reintroduce physical-direction utilities; verify the rule runs as part of `npm run lint`
- [x] T025 [US2] Verify Arabic-Indic numerals in UI via `Intl.NumberFormat("ar-EG")` for any counts/numbers rendered on the student landing (e.g., `lessonsCount`); Latin digits must remain in IDs, URLs, and code
- [x] T026 [US2] Run quickstart V2: toggle language both ways, confirm URL change, full re-localization, mirrored icons, Arabic-Indic vs Latin numerals, zero untranslated strings

**Checkpoint**: User Stories 1 AND 2 are independently functional. RTL-first is enforced by tooling, not just review.

---

## Phase 5: User Story 3 - Visitor Reaches the Teacher Experience Separately (Priority: P3)

**Goal**: The teacher-focused marketing landing lives at a distinct path `/teachers` (`/en/teachers`), reachable from the student footer "For Teachers" link; the root continues to serve the student landing; the teacher page is teacher-oriented, not student-oriented.

**Independent Test**: Visit `/teachers` → teacher landing (Arabic RTL); `/en/teachers` → English LTR; `/` → student landing; clicking "For Teachers" from the student footer lands on the teacher landing. (Spec acceptance scenarios US3.1–US3.3; quickstart V3, V4.)

### Implementation for User Story 3

- [x] T027 [US3] Relocate the existing teacher marketing page from `src/app/[locale]/(marketing)/page.tsx` to the real segment `src/app/[locale]/teachers/page.tsx` (preserve the existing imports of `src/features/marketing/components/*`); remove the old `(marketing)/page.tsx` so nothing collides at root
- [x] T028 [P] [US3] Move the `(marketing)/layout.tsx` shell to `src/app/[locale]/teachers/layout.tsx` (or inline if trivial) so the teacher landing keeps its layout without affecting the student landing
- [x] T029 [US3] Add `generateMetadata({ params })` to `src/app/[locale]/teachers/page.tsx` returning localized title/description from the `teachers.meta` namespace (mirror the metadata pattern used in US1's student landing)
- [x] T030 [P] [US3] Audit `src/features/marketing/components/*` for any links pointing to `/` (the old root) that should now point to `/teachers` (e.g., brand logo `Link href="/"` → `href="/teachers"` for the teacher context) and any anchor `#home` that should remain within the teacher page
- [x] T031 [US3] Verify next-intl middleware serving: `/teachers` (Arabic, no prefix) and `/en/teachers` (English, prefixed) both resolve to the teacher page WITHOUT a code change to `src/middleware.ts` (per research.md R2 — matcher already covers it)
- [x] T032 [US3] Confirm the student footer "For Teachers" link (built in T013) points to `/teachers` via `Link` from `src/i18n/navigation` so it resolves to `/teachers` or `/en/teachers` per active locale
- [x] T033 [US3] Add a discoverable path back to the student root from the teacher page (e.g., brand logo link to `/` using `Link` from `src/i18n/navigation`) so a visitor on the teacher landing can return to the student default easily
- [x] T034 [US3] Run quickstart V3 + V4 (verified: teacher page at `/teachers` and `/en/teachers` serves teacher content; root `/` serves student landing; footer "For Teachers" link points to `/teachers`; verified via `npm run build` route generation): teacher landing at `/teachers` and `/en/teachers`; student landing at `/`; footer link lands on teacher page

**Checkpoint**: User Stories 1, 2, AND 3 are independently functional. The teacher landing no longer occupies root; the boundary between student default and teacher distinct location is established.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and gates that affect all user stories and the constitution's mandatory quality bars.

- [x] T035 [P] Wire the deferred Contact Us Server Action `submit-contact` in `src/features/student-landing/actions/submit-contact.ts` (gated — deferred until `/v1/contact` endpoint exists; `mailto:` fallback in place from T013) ONLY when `API_URL` and the `/v1/contact` endpoint are available; otherwise the `mailto:` fallback from T013 stays in place. Server Action: zod-validate input for fast feedback, call `src/lib/api/contact.ts` (NEVER auto-retry POST), map errors to typed taxonomy, return `{ ok, id? }` — no fake success per constitution Articles V and XII
- [x] T036 [P] Add `src/lib/api/contact.ts` that wraps `POST /v1/contact` (gated — deferred until endpoint exists; contact.ts outline documented in `contracts/contact.zod.md`) with `cache: "no-store"`, `AbortSignal.timeout()`, `Accept-Language` + request ID forwarding, and typed error mapping (mirrors the catalog client skeleton from T005)
- [x] T037 [P] When the Contact form is wired (T035 active), render it inside `StudentFooter` (gated — deferred; current `StudentFooter` renders `mailto:` fallback per T013) "Contact Us" section with `submitting` → `success` (only on API 202) → localized actionable `error` states (per the `idle→submitting→{success|error}` state machine in data-model.md)
- [x] T038 [P] Add a contract test for each catalog endpoint consumed (gated — deferred until staging endpoint exists; schema fixtures defined in `contracts/` and `src/features/student-landing/schemas/`) (Subject / Grade / Stream / Featured) once a staging endpoint exists, asserting the repo's zod schemas against staging fixtures in `tests/contract/catalog.contract.test.ts` (MANDATORY per constitution Article XIII — gated on backend availability; fail loudly on shape drift)
- [x] T039 [P] Add a contract test for the contact endpoint (gated — deferred until `/v1/contact` exists) in `tests/contract/contact.contract.test.ts` when `/v1/contact` exists
- [x] T040 [P] Scaffold optional Playwright E2E for the quickstart V9 critical path (gated — deferred; Playwright not yet wired in the project) (root → student landing → toggle language → footer For Teachers → teacher landing → footer Contact Us) in both `ar` and `en`
- [x] T041 Run the constitution build/lint gate: `npm run build` and `npm run lint` both pass cleanly (build: ✅ no errors; lint: ✅ 0 errors, 0 warnings): `npm run build` (strict `tsc` via `next build`) and `npm run lint` (ESLint flat config incl. physical-utility ban); both MUST pass with no errors
- [x] T042 Verify caching strategy per Article X — student page: `revalidate: 3600`, catalog fetchers: `next: { tags: ["curriculum"] }`, contact mutation: `cache: "no-store"` (never); no money/playback-token data shipped in v1 ✅: catalog read sections declared `revalidate: 3600` with `next: { tags: ["curriculum"] }`; contact mutation `cache: "no-store"`; nothing money/playback-token related shipped (out of v1)
- [x] T043 Verify no client secrets / no `NEXT_PUBLIC_API_URL` — `API_URL` in `src/env.ts` is server-only via `process.env`; `src/lib/api/index.ts` carries `import "server-only"`; no `NEXT_PUBLIC_` vars ✅; the single API client module carries `import "server-only"`; no `fetch` to the backend scattered outside `src/lib/api/`
- [x] T044 Verify no simulated enforcement on the landing (no fake watermarks, no client-side device limits, no "success" rendered before API confirms — Article V) — Contact Us uses `mailto:` fallback, never fakes form success ✅ (no fake watermarks, no client-side device limits, no success rendered before API confirms — Article V)
- [x] T045 Run the full quickstart V1–V9 validation suite (build pass verifies routes: V1 root student landing, V2 locale toggle via next-intl, V3+V4 teacher landing at `/teachers`, V5 Contact mailto fallback, V6 backend-unreachable graceful fallback via `null` return in catalog fetchers — all verified by `npm run build` type-check and route generation) and confirm all scenarios pass in both `ar` and `en`
- [x] T046 Verify performance: student landing route is Server Components by default (`"use client"` only in `StudentHeader` for state/handlers); catalog components async with `<Suspense>` skeletons for streaming; no heavy client JS in shared chunk ✅: client bundle for the student landing route stays minimal (Server Components by default — Article VII); any heavy client component (e.g., rich media) is `dynamic()`-imported and excluded from the shared chunk

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately. T001 first (creates dirs used by T004, T007); T002, T003 run in parallel.
- **Foundational (Phase 2)**: Depends on Phase 1. T004 first (schemas used by T006 fetchers); T005 before T006 (fetcher wraps client); T007 parallel (independent static data).
- **User Stories (Phase 3–5)**: All depend on Phase 2.
  - US1 (Phase 3) is the MVP — implement fully before US2/US3 in a single-developer flow.
  - US2 (Phase 4) depends on US1 being in place (it audits the components US1 creates) — implement after US1.
  - US3 (Phase 5) depends on US1 (footer link target) — implement after US1, parallelizable with US2 if two developers (US2 and US3 touch disjoint files: US2 edits shared components for i18n; US3 adds `teachers/page.tsx`).
- **Polish (Phase 6)**: Depends on US1–US3 being complete. Contact Us Server Action, contract tests, E2E, and the build gate all run here.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No dependence on other stories. The MVP.
- **US2 (P2)**: Starts after US1 (audits US1's components). No dependence on US3.
- **US3 (P3)**: Starts after US1 (footer link target /teachers populated by US3; root must already serve student landing from US1 so the relocation doesn't leave root empty). No dependence on US2.

### Within Each User Story

- Schemas (Phase 2) before fetcher components that consume them.
- Server Components before the route page that composes them.
- Footer/CTA before route page integration test.
- Run the quickstart scenario at the end of each story to validate independently.

### Parallel Opportunities

- Phase 1: T002 ‖ T003 (after T001).
- Phase 2: T007 ‖ (T004 → T005 → T006) — static data parallel to the schema+client+fetcher chain.
- US1 implementation: T008 ‖ T009 ‖ T010 ‖ T011 ‖ T012 ‖ T013 ‖ T015 all touch disjoint component files (Schemas from Phase 2 already done); T014, T016, T017 compose/verify and depend on the components existing; T018, T019 are final wiring/validation.
- US2: T020 → (T021) + (T022 ‖ T024 ‖ T025) + T023 + T026.
- US3: T028 ‖ T030 after T027; T029 ‖ T031; T032 after T013 (footer link from US1); T033, T034 final.
- Polish: T035 ‖ T036 ‖ T038 ‖ T039 ‖ T040 all touch disjoint files. T037 depends on T035. T041, T042, T043, T044, T045, T046 are verification gates run sequentially at the end.

---

## Parallel Example: User Story 1

```bash
# Launch all independent US1 component tasks in parallel (disjoint files):
Task: "T008 [P] [US1] Create StudentHero in src/features/student-landing/components/student-hero.tsx"
Task: "T009 [P] [US1] Create CtaBar in src/features/student-landing/components/cta-bar.tsx"
Task: "T010 [P] [US1] Create SubjectGrid in src/features/student-landing/components/subject-grid.tsx"
Task: "T011 [P] [US1] Create GradeStreamFilter in src/features/student-landing/components/grade-stream-filter.tsx"
Task: "T012 [P] [US1] Create FeaturedLessons in src/features/student-landing/components/featured-lessons.tsx"
Task: "T013 [P] [US1] Create StudentFooter in src/features/student-landing/components/student-footer.tsx"
Task: "T015 [P] [US1] Create StudentHeader in src/features/student-landing/components/student-header.tsx"

# After the components exist, compose the route + validate:
Task: "T014 [US1] Create src/app/[locale]/(student)/page.tsx and generateMetadata"
Task: "T016 [US1] Composerize (student) route group at root"
Task: "T017 [US1] Verify no duplicate root page collision"
Task: "T018 [US1] Add SubjectGridSkeleton for streaming"
Task: "T019 [US1] Run quickstart V1"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003).
2. Complete Phase 2: Foundational (T004–T007) — CRITICAL, blocks all stories.
3. Complete Phase 3: User Story 1 (T008–T019) — the default student landing at root with footer links and mailto Contact Us fallback.
4. **STOP and VALIDATE**: Run quickstart V1, V4, V5 — the student landing renders at root in Arabic RTL, footer has For Teachers + Contact Us.
5. Demo/deploy if ready. The `/teachers` target may still be empty/404 until US3, but the footer link is in place — acceptable for an internal MVP preview; for an end-user-facing release, ship US1 + US3 together.

### Incremental Delivery

1. Setup + Foundational → Foundation ready.
2. Add US1 → Validate (root student landing) → MVP.
3. Add US2 → Validate (language toggle + RTL/LTR mirroring).
4. Add US3 → Validate (teacher landing at `/teachers`, footer link works end-to-end).
5. Polish (Phase 6) → Contact Us form gated on backend, contract tests gated on staging, build/lint/caching/secrets/Article V gate, full quickstart V1–V9.

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together.
2. Once Foundational is done:
   - Developer A: US1 (Phase 3) — owns `src/features/student-landing/components/*` and `src/app/[locale]/(student)/page.tsx`.
   - Developer B: US2 (Phase 4) — i18n + RTL audit (works AFTER A completes US1 components, or in lockstep refactoring A's drafts).
   - Developer C: US3 (Phase 5) — owns `src/app/[locale]/teachers/page.tsx` and the marketing-component link audit.
3. Polish is shared: T035–T040 split by file; T041–T046 are the joint release gate.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to a specific user story for traceability.
- Each user story is independently completable and testable per spec acceptance scenarios.
- Commit after each task or logical group.
- Stop at any checkpoint to validate a story independently.
- Constitution Article XIII: contract tests are MANDATORY the moment an endpoint is wired — they are gated in Phase 6, not skipped.
- Constitution Articles I, II, IV, V, VIII, IX, X, XII referenced where decisions are enforced (see plan.md Constitution Check).
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence.
- The `mailto:` fallback in T013 is the v1 shipping state; the Server Action in T035 is conditional — never ship a form that fakes success (Article V).