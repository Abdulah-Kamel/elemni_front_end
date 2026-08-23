# Elemni Frontend

Frontend for Elemni's public teacher discovery and student experience. The repo currently includes:

- the public student landing page
- public teacher discovery and teacher profile pages
- teacher-marketing pages
- student authentication and onboarding
- the authenticated student portal: dashboard, my courses, explore, and course detail
- Next route handlers that proxy authenticated student requests to the backend API

This is still a frontend-only repo. Business rules, authorization, payments, and protected content policy remain backend-owned.

## Stack

- Next.js 16.2.10 App Router
- React 19
- TypeScript 5
- Tailwind CSS v4
- next-intl
- motion
- Vitest
- Playwright

Package manager: `npm`

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

`src/env.ts` currently reads:

- `API_URL`
- `CONTACT_EMAIL`

`.env.example` also includes `ASSETS_URL` as a template placeholder for backend/public asset origins, but it is not currently read by `src/env.ts`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build and TypeScript gate |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run test:unit` | Vitest unit/component tests |
| `npm run test:unit:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run test` | Unit tests, then e2e tests |
| `npm run perf:audit` | Build, then Lighthouse CI |

Notes:

- `next build` does not replace `npm run lint`; run both when needed.
- `npm run test` starts with unit tests and then runs Playwright.

## Current route surface

Public:

- `/`
- `/teachers`
- `/teachers/[id]`
- `/browse-teachers`
- `/for-teachers`

Student auth:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

Authenticated student:

- `/onboarding`
- `/dashboard`
- `/my-courses`
- `/explore`
- `/courses/[courseId]`

Backend-for-frontend routes:

- `/api/student/auth/*`
- `/api/student/my-courses`
- `/api/student/my-courses/[courseId]`
- `/api/student/payments/checkout`

## Architecture

The repo is feature-first.

```text
src/
  app/                  Thin App Router entrypoints
  components/ui/        Shared UI primitives
  features/             Feature-owned UI and view logic
  i18n/                 next-intl routing helpers
  lib/student-api/      Backend boundary for the student-facing app
  messages/             AR/EN copy
  proxy.ts              Locale proxy
```

Current feature ownership:

- `src/features/landing` — public student landing page
- `src/features/marketing` — teacher-marketing surface
- `src/features/teachers` — teacher browse/profile experience
- `src/features/auth` — login/register/reset flows
- `src/features/onboarding` — student onboarding
- `src/features/dashboard` — dashboard and my-courses UI
- `src/features/courses` — explore and course detail UI
- `src/features/portal` — authenticated student shell

### Backend boundary

The active integration layer is `src/lib/student-api/*`:

- `backend.ts` — server-side backend fetch wrapper
- `session.ts` — httpOnly cookie session handling and refresh flow
- `public.ts` — public catalog/teacher reads
- `contract.ts` — DTOs
- `adapters.ts` — DTO → UI shaping

`src/lib/api/index.ts` exists, but it currently has no call sites. New student-facing backend work should extend `src/lib/student-api/*` unless you are deliberately consolidating the API layer.

### Routing rules

- App routes should stay thin and compose feature modules.
- Authenticated browser actions should go through Next route handlers, not directly to the backend API.
- Server Components are the default. Add `"use client"` only where state, effects, event handlers, or browser APIs are required.

## i18n and RTL

- Locales: `ar` and `en`
- Default locale: `ar`
- `localePrefix: "as-needed"`
- `localeDetection: false`

Keep all user-facing copy in:

- `src/messages/ar.json`
- `src/messages/en.json`

Use logical direction utilities only: `ms/me`, `ps/pe`, `start/end`, `text-start/text-end`.

## Tests

Current tracked test coverage includes:

- unit/component tests under `src/features/**`
- Playwright smoke coverage in `tests/e2e/app-smoke.spec.ts`

When changing route ownership, auth guards, or shared shells, keep a focused preserved-behavior test in place before moving code.

## Docs

Tracked repo docs now live under `docs/`:

- `docs/reference/` — reference material such as backend business flow
- `docs/specs/` — product/design/spec documents
- `docs/superpowers/` — historical planning and execution notes

## Repo policy

Tracked:

- source, configs, tests, and `docs/`
- `.env.example`

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
