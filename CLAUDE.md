# CLAUDE.md

Guidance for Claude Code and other coding agents working in this repository.

@AGENTS.md

## First rules

- Read `AGENTS.md` first.
- Read the relevant Next.js 16 docs in `node_modules/next/dist/docs/` before changing framework code.
- Verify the current repo shape before assuming a path from older plans or stale docs.
- Use `rg` for search.

## Current repo state

This is not a fresh scaffold. The repo already has a feature-first `src/` layout and active student-facing flows.

Current implemented surfaces:

- public student landing page
- public teacher browse and teacher profile pages
- teacher-marketing surface at `/for-teachers`
- student login/register/forgot-password/reset-password
- student onboarding
- student dashboard, my-courses, explore, and course-detail pages
- Next BFF routes for student auth, my-courses, and checkout

Not implemented here:

- teacher dashboard/productivity area
- admin area
- mobile app

## Commands

Package manager: `npm`

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:unit
npm run test:unit:watch
npm run test:e2e
npm run test
npm run perf:audit
```

Important:

- `npm run build` is the TypeScript gate.
- `npm run lint` is separate; Next 16 does not make a green build imply clean lint.
- `npm run test` runs unit tests first, then Playwright e2e.

## Environment

Copy `.env.example` to `.env.local`.

`src/env.ts` currently validates:

- `API_URL`
- `CONTACT_EMAIL`

`.env.example` also contains `ASSETS_URL`, but the current runtime env schema does not read it.

## Current structure

```text
src/
  app/
    [locale]/
      (student)/page.tsx
      dashboard/page.tsx
      my-courses/page.tsx
      explore/page.tsx
      courses/[courseId]/page.tsx
      teachers/page.tsx
      teachers/[id]/page.tsx
      for-teachers/page.tsx
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
      reset-password/page.tsx
      onboarding/page.tsx
    api/student/
  components/ui/
  features/
    auth/
    courses/
    dashboard/
    landing/
    marketing/
    onboarding/
    portal/
    teachers/
  i18n/
  lib/
    api/
    student-api/
  messages/
  proxy.ts
  env.ts
```

Feature ownership today:

- `landing` = public student landing
- `marketing` = teacher-acquisition surface
- `teachers` = public teacher browse/profile
- `auth` = student auth UI
- `onboarding` = student onboarding
- `dashboard` = dashboard + my-courses views
- `courses` = explore + course detail
- `portal` = authenticated student shell

## Architecture rules

### 1. Thin routes

Keep `src/app/**` thin. Route files should mostly:

- set locale / metadata
- enforce auth redirects when needed
- load server-side data
- hand off to feature components

Do not let route files grow into feature implementations.

### 2. Server Components by default

Use `"use client"` only for:

- state
- event handlers
- effects
- browser-only APIs
- client-only animation/state orchestration

Push the client boundary down.

### 3. The active backend boundary is `src/lib/student-api/*`

Current student/backend integration lives here:

- `backend.ts`
- `session.ts`
- `public.ts`
- `contract.ts`
- `adapters.ts`

Use this layer for new student-facing backend work.

`src/lib/api/index.ts` exists but currently has no call sites. Do not spread new code across both API layers accidentally. If you want to revive or consolidate `src/lib/api/`, do it as an explicit refactor.

### 4. Authenticated browser traffic goes through Next

Do not have client components call the backend directly for authenticated work.

Use:

- `src/app/api/student/auth/*`
- `src/app/api/student/my-courses/*`
- `src/app/api/student/payments/checkout`

These route handlers own cookie-backed session forwarding to the backend.

### 5. Cookies, not client-readable tokens

Session state is handled with httpOnly cookies in `src/lib/student-api/session.ts`.

Do not put access tokens in:

- `localStorage`
- `sessionStorage`
- Redux/client state
- `NEXT_PUBLIC_*`

### 6. i18n and RTL are not optional

- Default locale is Arabic.
- All user-facing strings belong in `src/messages/ar.json` and `src/messages/en.json`.
- Use logical Tailwind utilities only.
- Be careful with directional icons and physical transforms.

### 7. Feature-first structure

Do not create dumping-ground roots like:

- `src/components/`
- `src/hooks/`
- `src/utils/`

unless the code is truly shared. Keep code in its feature until there is a clear third-use promotion case.

### 8. No barrel files

Import concrete modules directly.

### 9. Path alias

`@/*` points to the repo root, not `src/`.

Use imports like:

```ts
import Something from "@/src/features/courses/components/explore-courses";
```

not `@/features/...`.

## Testing expectations

Use focused verification proportional to the change:

- component/shell/refactor changes: `npm run test:unit -- <path>`
- route/guard/integration changes: `npm run test`
- release-level confidence: `npm run build` and `npm run lint`

For refactors, preserve behavior with a red/green characterization test before moving code.

## Docs and repo policy

Tracked docs live under `docs/`:

- `docs/reference/`
- `docs/specs/`
- `docs/superpowers/`

Local-only and ignored:

- `.env.local`
- `.next/`
- `node_modules/`
- `test-results/`
- `design/`
- `assets/`
- `.specify/`
- `.superpowers/`
- `.claude/`
- other local agent/tool state

## Product boundary

This repo owns:

- rendering
- routing
- i18n/RTL
- UI state and interaction
- accessibility
- backend proxying from the Next layer

This repo does not own:

- authorization policy
- payment/business rules
- source-of-truth pricing logic
- DRM enforcement policy

If a rule belongs to the product/business domain, the backend should own it and the frontend should display or forward it, not redefine it.
