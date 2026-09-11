# Student Dashboard Flow Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Arabic student portal into a focused learning loop with reliable resume progress, fewer dead ends, intent-preserving authentication, simpler discovery, and a consistent visual hierarchy.

**Architecture:** Add a small backend-owned enrollment progress record and expose it through the existing `/api/v1/my/courses` contract plus a progress update endpoint. Keep authenticated traffic behind the existing Next BFF routes. Refine the current dashboard, portal shell, explore, and course-detail components in separate passes so every phase has its own test gate.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Pydantic, Next.js 16, React 19, TanStack Query, Vitest, Playwright, Tailwind CSS.

**Spec:** `docs/superpowers/plans/2026-09-09-student-dashboard-flow-enhancement.md`

## Global Constraints

- Arabic and RTL are the only supported student experience in this implementation; do not add or prioritize English/LTR work.
- Preserve the existing user’s uncommitted files, especially backend working-tree files unrelated to this plan.
- Authenticated browser requests must continue through the Next BFF and httpOnly cookie session.
- Do not commit from OpenCode; the orchestrator reviews and commits only verified changes.
- Use TDD for behavior changes: failing test, verified red, minimal implementation, verified green.

---

### Task 1: Enrollment progress and resume learning

**Files:**
- Create: `elemni/src/courses/progress_models.py` or the existing courses model module if the project convention requires one model file.
- Modify: `elemni/src/courses/models.py`, `elemni/src/courses/schemas.py`, `elemni/src/courses/service.py`, `elemni/src/courses/router.py`.
- Create: `elemni/alembic/versions/<revision>_add_enrollment_progress.py`.
- Modify: `elemni_front_end/src/lib/student-api/contract.ts`, `elemni_front_end/src/app/api/student/my-courses/route.ts`, `elemni_front_end/src/app/api/student/my-courses/[courseId]/progress/route.ts`, `elemni_front_end/src/features/student/hooks/use-student-queries.ts`.
- Modify: `elemni_front_end/src/features/dashboard/components/student-dashboard.tsx`, `elemni_front_end/src/features/dashboard/components/my-courses.tsx`, `elemni_front_end/src/features/courses/components/course-detail.tsx`, `elemni_front_end/src/features/courses/components/curriculum-accordion.tsx`.
- Test: `elemni/tests/courses/test_student_progress.py`, focused frontend component/API tests beside the changed components.

**Interfaces:**
- `EnrollmentOut.progress` returns `completion_percent`, `completed_item_ids`, `last_item_id`, `last_lesson_id`, `next_item_id`, `next_lesson_id`, and `last_opened_at`.
- `PUT /api/v1/my/courses/{course_id}/progress` accepts `{ "item_id": number, "completed": boolean }` and returns the updated progress object.
- The Next BFF exposes the same update through `/api/student/my-courses/{courseId}/progress`.

- [ ] Write backend tests for an enrolled student reading empty progress, opening an item, completing an item, and rejecting an item from another course.
- [ ] Run the focused backend tests and confirm they fail because progress storage and routes do not exist.
- [ ] Add the progress model, migration, schemas, enrollment serialization, authenticated service method, and route.
- [ ] Run the focused backend tests and confirm they pass.
- [ ] Write frontend tests proving the dashboard renders a resume action from `next_item_id` and the course curriculum can update completion.
- [ ] Run the focused frontend tests and confirm they fail before the UI wiring exists.
- [ ] Add the Next BFF route, query mutation, resume deep-link, progress display, and Arabic copy.
- [ ] Run focused frontend tests, lint, typecheck/build, and backend tests.

### Task 2: Remove unfinished destinations and strengthen session recovery

**Files:**
- Modify: `elemni_front_end/src/features/portal/components/portal-shell.tsx`.
- Modify: `elemni_front_end/src/features/courses/components/course-detail.tsx`, `elemni_front_end/src/features/courses/components/course-purchase-panel.tsx`.
- Modify: `elemni_front_end/src/app/[locale]/login/page.tsx`, auth navigation helpers, and the protected student route guards as needed.
- Test: `elemni_front_end/src/features/portal/components/portal-shell.test.tsx`, course-detail tests, and auth redirect tests.

**Interfaces:**
- Sidebar contains only working destinations: الرئيسية, دوراتي, استكشف, and تسجيل الخروج.
- Login accepts a validated `next` path and returns the student to the original course or dashboard action.

- [ ] Write failing tests proving unavailable sidebar items and disabled course tabs are absent, and login preserves a safe same-origin return path.
- [ ] Verify red.
- [ ] Remove dead navigation/tabs and thread a safe return path through login and checkout redirects.
- [ ] Verify focused tests, then run the portal and course-detail suites.

### Task 3: Simplify Arabic course discovery and preserve filters

**Files:**
- Modify: `elemni_front_end/src/features/courses/components/explore-courses.tsx`.
- Modify: `elemni_front_end/src/features/dashboard/components/my-courses.tsx` if filter behavior is shared.
- Test: explore component tests and e2e coverage for search, filtering, back navigation, and reset.

**Interfaces:**
- Search, grade, stream, subject, teacher, sort, view, and page state are represented in the URL.
- Desktop presents a compact filter row; mobile presents one filters control and a clear-all action.

- [ ] Write failing tests for URL restoration and reset behavior.
- [ ] Verify red.
- [ ] Move filter state to URL-backed state, reduce the visible decision count, and preserve Arabic labels.
- [ ] Verify focused tests and mobile/desktop layout behavior.

### Task 4: Make the learning surface easier to resume

**Files:**
- Modify: `elemni_front_end/src/features/courses/components/course-detail.tsx`, `learner-player.tsx`, `learner-curriculum-sidebar.tsx`, and `curriculum-accordion.tsx`.
- Modify: `elemni_front_end/src/features/dashboard/components/student-dashboard.tsx` and `my-courses.tsx`.
- Test: course-detail container tests and dashboard tests.

**Interfaces:**
- Enrolled course detail opens the current item, keeps the curriculum reachable, and provides an obvious next-item action.
- Public course detail keeps preview content and one clear subscribe CTA without exposing unavailable internal tabs.

- [ ] Write failing tests for deep-linking to a saved item and rendering the next-item action.
- [ ] Verify red.
- [ ] Implement the enrolled/public composition and Arabic learning-state copy.
- [ ] Verify focused tests and the course-detail flow.

### Task 5: Final visual and interaction pass

**Files:**
- Modify: `elemni_front_end/src/features/portal/components/portal-shell.tsx` and `elemni_front_end/src/features/portal/styles/portal-shell.css`.
- Modify: dashboard, my-courses, explore, and course-detail components only where the behavior above needs visual support.
- Test: full frontend unit suite, lint, build, and relevant e2e flows.

**Interfaces:**
- Keep the current Arabic/RTL direction and blue product accent.
- Use the accent for active learning/progress states, soften repeated borders, and keep primary actions consistent.

- [ ] Write or update characterization tests for active navigation and responsive drawer behavior.
- [ ] Verify red where behavior changes.
- [ ] Apply the final visual hierarchy and remove detector warnings that are not semantically necessary.
- [ ] Run the full frontend gates and the backend progress tests.
- [ ] Review the final diff for scope and preserve unrelated working-tree changes.
