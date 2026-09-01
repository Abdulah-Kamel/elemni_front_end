# Course Learning UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the student course detail, enrolled learning view, and PayTabs handoff with a responsive Elemni marketplace/classroom experience.

**Architecture:** Keep `/courses/[courseId]` as the canonical route with public and enrolled states. Make the BFF session-optional for public requests, isolate the client orchestration into focused course components, and place a confirmation dialog/sheet in front of the existing checkout redirect.

**Tech Stack:** Next 16 App Router, React 19, Tailwind v4, Motion, TanStack Query, next-intl, lucide-react already present in the project.

**Spec:** `docs/superpowers/specs/2026-09-01-course-learning-ux-design.md`

## Global Constraints

- Preserve the existing route slugs, backend payment contract, cookie-based sessions, and protected media behavior.
- Do not put access tokens in localStorage, sessionStorage, or client state.
- All user-facing strings belong in `src/messages/ar.json` and `src/messages/en.json`.
- Use logical RTL utilities and test Arabic and English.
- Keep app routes thin and use `src/lib/student-api/*` plus Next BFF routes for backend work.
- Do not add a second HTTP client or new UI dependency without a verified need.
- Do not add paragraph-level `max-w-3xl`; keep responsive measure in the layout.
- Preserve existing user work outside this worktree and leave unrelated files untouched.

---

### Task 1: Establish public/enrolled BFF behavior

**Files:**
- Modify: `src/app/api/student/my-courses/[courseId]/route.ts`
- Modify: `src/app/[locale]/courses/[courseId]/page.tsx`
- Test: `src/app/api/student/my-courses/[courseId]/route.test.ts` (create if absent)

**Interfaces:**
- Produces `GET /api/student/my-courses/:courseId?teacher=<slug>` that returns a public `StudentCourseDetailDto` without requiring an access token, while retaining protected data for an enrolled session.
- `CourseDetail` receives an `isAuthenticated: boolean` prop so the client does not infer auth from a failed query.

- [ ] **Step 1: Write failing route tests** for a guest public request and an enrolled protected request. Assert the guest path does not call `/api/v1/my/courses`, while the enrolled path still returns the enrollment shape.
- [ ] **Step 2: Run `npm run test:unit -- src/app/api/student/my-courses/[courseId]/route.test.ts`** and confirm the new guest assertion fails because the route currently requires authentication.
- [ ] **Step 3: Implement the smallest session-optional BFF branch** using `getAccessToken()`/the existing session helpers. Keep the public teacher-slug resolution and existing protected owner lookup intact.
- [ ] **Step 4: Remove the route-level login redirect**, load only public metadata server-side, and pass `isAuthenticated` into `CourseDetail`.
- [ ] **Step 5: Run the focused route tests and the existing course-detail test**; both must pass.
- [ ] **Step 6: Commit** with `git add src/app/api/student/my-courses/[courseId]/route.ts src/app/[locale]/courses/[courseId]/page.tsx src/app/api/student/my-courses/[courseId]/route.test.ts && git commit -m "feat: allow public course detail discovery"`.

### Task 2: Add course presentation components and translation contract

**Files:**
- Create: `src/features/courses/components/course-hero.tsx`
- Create: `src/features/courses/components/course-purchase-panel.tsx`
- Create: `src/features/courses/components/curriculum-accordion.tsx`
- Create: `src/features/courses/components/learner-player.tsx`
- Modify: `src/features/courses/components/course-detail.tsx`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/en.json`
- Test: `src/features/courses/components/course-detail.container.test.tsx`

**Interfaces:**
- `CourseHero` accepts `{ course: PublicCourseDto; teacher: StudentCourseTeacherDto | null; gradeName?: string; streamName?: string; examCount: number }`.
- `CoursePurchasePanel` accepts `{ course: PublicCourseDto; enrollment: EnrollmentDto | null; onPurchase: () => void; onContinue: () => void; loading: boolean }`.
- `CurriculumAccordion` accepts `{ chapters: PublicChapterDto[]; enrolled: boolean; activeVideoId: number | null; expandedChapterId: number | null; expandedLessonId: number | null; onChapterToggle; onLessonToggle; onPlay }`.
- `LearnerPlayer` accepts `{ activeVideo: { item: PublicItemDto; lesson: PublicLessonDto } | null }` and renders no iframe when inactive.

- [ ] **Step 1: Add failing component behavior assertions** for translated public copy, the hero title/metadata, the guest purchase panel, and the enrolled player region.
- [ ] **Step 2: Run the focused test and confirm failure** because the current monolith does not expose the new component states.
- [ ] **Step 3: Extract the four focused components** without changing data semantics. Keep lucide icons because the project already depends on them.
- [ ] **Step 4: Move visible course-detail strings into the existing Arabic/English message namespaces** and use `useTranslations`/`useLocale` in the client tree.
- [ ] **Step 5: Recompose `CourseDetail` around the extracted components**, remove the description `max-w-3xl`, and preserve the existing query/refetch/error behavior.
- [ ] **Step 6: Run the focused component tests and `npm run lint`**; fix only regressions caused by this task.
- [ ] **Step 7: Commit** with `git add src/features/courses/components src/messages/ar.json src/messages/en.json && git commit -m "refactor: split course learning presentation"`.

### Task 3: Build the responsive marketplace/classroom layout

**Files:**
- Modify: `src/features/courses/components/course-detail.tsx`
- Modify: `src/features/courses/components/course-hero.tsx`
- Modify: `src/features/courses/components/course-purchase-panel.tsx`
- Modify: `src/features/courses/components/learner-player.tsx`
- Test: `src/features/courses/components/course-detail.container.test.tsx`

**Interfaces:**
- Public state renders the purchase panel and curriculum preview.
- Enrolled state renders the learner player and continue action in the same canonical route.

- [ ] **Step 1: Add failing assertions** that the guest state renders “sign in to enroll”/purchase context and the enrolled state renders the player before curriculum when a playable item exists.
- [ ] **Step 2: Run the focused test and confirm failure** against the old hero/player order.
- [ ] **Step 3: Implement the split desktop grid** with explicit mobile stacking, fixed media aspect ratio, and no paragraph max-width hack.
- [ ] **Step 4: Add motivated Motion entrance/state transitions** guarded by `useReducedMotion`, preserving focus and scroll anchors.
- [ ] **Step 5: Add loading skeleton structure and contextual error/empty states** that match the final layout.
- [ ] **Step 6: Run focused tests at the desktop and narrow viewport assumptions represented by the component DOM, then run `npm run lint`**.
- [ ] **Step 7: Commit** with `git add src/features/courses/components && git commit -m "feat: redesign course detail learning layout"`.

### Task 4: Add checkout confirmation dialog/sheet

**Files:**
- Create: `src/features/courses/components/checkout-confirmation.tsx`
- Modify: `src/features/courses/components/course-detail.tsx`
- Modify: `src/features/courses/components/course-purchase-panel.tsx`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/en.json`
- Test: `src/features/courses/components/course-detail.container.test.tsx`

**Interfaces:**
- `CheckoutConfirmation` accepts `{ open: boolean; course: PublicCourseDto; teacher: StudentCourseTeacherDto | null; loading: boolean; error: string; onOpenChange; onConfirm }`.
- `onConfirm` invokes the existing `/api/student/payments/checkout` flow and never computes a price.

- [ ] **Step 1: Add failing tests** for opening the confirmation surface, displaying the backend price and 30-day copy, canceling without a network request, and confirming with `{ course_id }`.
- [ ] **Step 2: Run the focused test and confirm failure** because checkout currently redirects directly from the CTA.
- [ ] **Step 3: Implement the accessible responsive dialog/sheet** with focus return, keyboard dismissal, explicit button contrast, and mobile-safe spacing using existing project primitives.
- [ ] **Step 4: Move checkout lifecycle state into the confirmation flow** while preserving 401, 409, and generic error handling.
- [ ] **Step 5: Run focused tests and `npm run lint`**.
- [ ] **Step 6: Commit** with `git add src/features/courses/components src/messages/ar.json src/messages/en.json && git commit -m "feat: add checkout confirmation flow"`.

### Task 5: Verify responsive, locale, and release behavior

**Files:**
- Modify: only files required by failing verification.
- Test: existing course-detail tests and relevant Playwright coverage if available.

- [ ] **Step 1: Run `npm run test:unit` and record the complete result.**
- [ ] **Step 2: Run `npm run lint` and fix lint errors caused by this feature.**
- [ ] **Step 3: Run `npm run build` and fix type/build errors caused by this feature.**
- [ ] **Step 4: Inspect Arabic and English at desktop, tablet, and mobile widths; verify no horizontal overflow, focus loss, or copy direction regressions.**
- [ ] **Step 5: Run the Impeccable detector once against changed UI files:** `node /home/abdullahkm/.agents/skills/impeccable/scripts/detect.mjs --json <changed-ui-files>`.
- [ ] **Step 6: Run `git diff --check`, inspect the complete diff, and confirm only intended files changed.**
- [ ] **Step 7: Commit any verification-only fixes by category.**
