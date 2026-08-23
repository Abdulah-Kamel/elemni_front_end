# Feature Ownership Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the app from historical feature names to product-surface ownership while preserving current behavior where intended, retiring legacy feature trees, and enforcing TDD throughout the migration.

**Architecture:** The refactor proceeds in thin vertical slices. First add testing infrastructure that matches Next.js App Router constraints: Playwright for async route coverage and Vitest for synchronous/client units. Then migrate ownership in order: `landing`, `teachers`, `courses`, `dashboard`, `teacher-marketing`, and only after route owners are stable, extract genuinely shared code and delete retired feature trees.

**Tech Stack:** Next.js 16.2.10 App Router, React 19, TypeScript 5, next-intl 4, Vitest, React Testing Library, Playwright

**Spec:** `docs/superpowers/specs/2026-08-20-feature-ownership-refactor-design.md`

## Global Constraints

- Keep a feature-first folder structure.
- Replace historical names with product-surface names.
- Make one feature the clear owner of each page and route family.
- Retire `student-landing`.
- Retire `student-redesign` as a name by folding it into clearer feature ownership.
- Split `student-portal` so it only owns the authenticated student application surfaces it should own.
- Preserve current user-facing behavior unless a route change is necessary to remove structural confusion.
- Do not redesign page UI in this refactor pass.
- Do not rewrite backend contracts or API semantics in this pass.
- Do not extract shared code prematurely into a catch-all utilities area.
- Do not change URLs unless the current route structure blocks clear feature ownership.
- No production refactor code without a failing test first.
- Every route or ownership move that changes behavior expectations must follow red-green-refactor.
- Existing behavior being preserved still requires tests that prove the preserved behavior.
- Tests written after the move are not acceptable evidence for correctness.

---

## File Structure

- `src/features/landing/` — new canonical home for the public student landing page and landing-only sections now living under `student-redesign` and `student-landing`.
- `src/features/teachers/` — new canonical home for public teacher discovery and public teacher profile flows.
- `src/features/courses/` — new canonical home for public course discovery and public course detail.
- `src/features/dashboard/` — new canonical home for authenticated student dashboard and enrolled-course surfaces.
- `src/features/teacher-marketing/` — new home for the current teacher acquisition page at `/teachers`, later moved to `/for-teachers`.
- `src/features/shared/` — only for stable UI/data code used by two or more top-level features after duplication is proven.
- `src/app/[locale]/...` — route files stay thin and import their feature owners only.
- `tests/e2e/` — Playwright route smoke and redirect coverage for async App Router pages.
- `src/test/` and colocated `*.test.tsx` — Vitest setup and unit coverage for extracted synchronous/client units.

### Task 1: Add TDD test infrastructure for App Router refactors

**Files:**
- Modify: `package.json`
- Create: `vitest.config.mts`
- Create: `playwright.config.ts`
- Create: `src/test/setup.ts`
- Create: `tests/e2e/app-smoke.spec.ts`
- Create: `src/features/student-auth/components/auth-page-shell.test.tsx`

**Interfaces:**
- Consumes: existing route files under `src/app/[locale]/`; `AuthPageShell` default export from `src/features/student-auth/components/auth-page-shell.tsx`
- Produces:
  - npm scripts: `"test:unit": "vitest run"`, `"test:unit:watch": "vitest"`, `"test:e2e": "playwright test"`, `"test": "npm run test:unit && npm run test:e2e"`
  - Vitest jsdom environment with Testing Library matchers loaded from `src/test/setup.ts`
  - Playwright config with `webServer` running `npm run build && npm run start`

- [ ] **Step 1: Install the test dependencies required by the official Next.js docs**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths @playwright/test
```

- [ ] **Step 2: Add test scripts to `package.json`**

```json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:e2e": "playwright test",
    "test": "npm run test:unit && npm run test:e2e"
  }
}
```

- [ ] **Step 3: Create `vitest.config.mts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
```

- [ ] **Step 4: Create `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Create `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3000",
    headless: true,
  },
  webServer: {
    command: "npm run build && npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

- [ ] **Step 6: Write the failing unit test for the existing auth shell**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AuthPageShell from "./auth-page-shell";

describe("AuthPageShell", () => {
  it("renders the provided title and subtitle", () => {
    render(
      <AuthPageShell
        title="تسجيل الدخول"
        subtitle="ابدأ من هنا"
      >
        <div>form body</div>
      </AuthPageShell>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "تسجيل الدخول" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ابدأ من هنا")).toBeInTheDocument();
    expect(screen.getByText("form body")).toBeInTheDocument();
  });
});
```

- [ ] **Step 7: Run the unit test to verify it fails because the test harness is not fully wired yet**

Run: `npm run test:unit -- src/features/student-auth/components/auth-page-shell.test.tsx`
Expected: FAIL with missing config or matcher/setup errors before the config files are added, or with an import/render assertion failure if config is already wired

- [ ] **Step 8: Write the minimal production code/config needed to make the unit test pass**

```tsx
// No production code change should be necessary beyond keeping AuthPageShell's
// current public interface intact. If the component already satisfies the
// behavior, only the test harness files from Steps 2-5 should be needed.
```

- [ ] **Step 9: Re-run the focused unit test to verify it passes**

Run: `npm run test:unit -- src/features/student-auth/components/auth-page-shell.test.tsx`
Expected: PASS

- [ ] **Step 10: Write the failing E2E smoke test for the currently working public/auth routes**

```ts
import { expect, test } from "@playwright/test";

test("public and guarded student routes keep their current baseline behavior", async ({ page }) => {
  await page.goto("/ar/");
  await expect(page).toHaveURL(/\/ar$/);

  await page.goto("/ar/browse-teachers");
  await expect(page).toHaveURL(/\/ar\/browse-teachers$/);
  await expect(page.getByRole("heading", { level: 1, name: "جميع المدرسين" })).toBeVisible();

  await page.goto("/ar/dashboard");
  await expect(page).toHaveURL(/\/ar\/login$/);
});
```

- [ ] **Step 11: Run the E2E smoke test to verify it fails before the Playwright setup is usable**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts`
Expected: FAIL with missing Playwright config/browser setup before the config exists, or with a route assertion failure if the config is already wired

- [ ] **Step 12: Re-run the E2E smoke test after the config is in place**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts`
Expected: PASS

- [ ] **Step 13: Commit the test infrastructure**

```bash
git add package.json package-lock.json vitest.config.mts playwright.config.ts src/test/setup.ts tests/e2e/app-smoke.spec.ts src/features/student-auth/components/auth-page-shell.test.tsx
git commit -m "test: add app router unit and e2e test harness"
```

### Task 2: Create the `landing` feature and move the public landing owner there

**Files:**
- Create: `src/features/landing/page.tsx`
- Create: `src/features/landing/landing.css`
- Create: `src/features/landing/components/client/landing-interactive-shell.tsx`
- Create: `src/features/landing/components/client/landing-reveal-controller.tsx`
- Create: `src/features/landing/components/client/navbar.tsx`
- Create: `src/features/landing/components/client/interactive-quiz.tsx`
- Create: `src/features/landing/components/client/faq-section.tsx`
- Create: `src/features/landing/components/client/whatsapp-button.tsx`
- Create: `src/features/landing/components/client/video-modal.tsx`
- Create: `src/features/landing/components/client/auth-modal.tsx`
- Create: `src/features/landing/components/server/hero.tsx`
- Create: `src/features/landing/components/server/subject-grid.tsx`
- Create: `src/features/landing/components/server/featured-lessons.tsx`
- Create: `src/features/landing/components/server/bento-grid.tsx`
- Create: `src/features/landing/components/server/comparison.tsx`
- Create: `src/features/landing/components/server/mobile-app.tsx`
- Create: `src/features/landing/components/server/final-cta.tsx`
- Create: `src/features/landing/components/server/footer.tsx`
- Create: `src/features/landing/components/server/testimonials.tsx`
- Create: `src/features/landing/components/server/features.tsx`
- Create: `src/features/landing/components/server/teacher-join-cta.tsx`
- Create: `src/features/landing/data/mock-data.ts`
- Create: `src/features/landing/types.ts`
- Modify: `src/app/[locale]/(student)/page.tsx`
- Test: `tests/e2e/app-smoke.spec.ts`

**Interfaces:**
- Consumes: current `StudentLandingPage` default export from `src/features/student-redesign/page.tsx`; `TeacherSummary`-style landing props; public API adapters from `@/src/lib/student-api/*`
- Produces:
  - `src/features/landing/page.tsx` default export `LandingPage`
  - route import in `src/app/[locale]/(student)/page.tsx` pointing to `@/src/features/landing/page`

- [ ] **Step 1: Write the failing E2E assertion that the landing route still renders from the app root after the ownership move**

```ts
import { expect, test } from "@playwright/test";

test("landing route still renders the student landing page after moving feature ownership", async ({ page }) => {
  await page.goto("/ar/");
  await expect(page).toHaveURL(/\/ar$/);
  await expect(page.getByRole("link", { name: /ابدأ/i })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused E2E test to capture the red state**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "landing route still renders"`
Expected: FAIL once the route import is intentionally switched to a not-yet-created `@/src/features/landing/page` module

- [ ] **Step 3: Create the new `landing` feature files by copying the current `student-redesign` landing owner and its landing-only dependencies**

```ts
// src/features/landing/page.tsx
export { default } from "@/src/features/student-redesign/page";
```

```ts
// src/app/[locale]/(student)/page.tsx
import LandingPage from "@/src/features/landing/page";
```

Use this wrapper form first so the route owner changes before internal file moves. After the route is green, replace re-exports with real local files by moving the implementations from `student-redesign` into `landing`.

- [ ] **Step 4: Re-run the focused E2E landing test**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "landing route still renders"`
Expected: PASS

- [ ] **Step 5: Move the landing-only implementation files from `student-redesign` into `landing` and remove the temporary re-export**

```bash
mv src/features/student-redesign/page.tsx src/features/landing/page.tsx
mv src/features/student-redesign/redesign.css src/features/landing/landing.css
mv src/features/student-redesign/components/client/landing-interactive-shell.tsx src/features/landing/components/client/landing-interactive-shell.tsx
mv src/features/student-redesign/components/client/landing-reveal-controller.tsx src/features/landing/components/client/landing-reveal-controller.tsx
mv src/features/student-redesign/components/client/navbar.tsx src/features/landing/components/client/navbar.tsx
mv src/features/student-redesign/components/client/interactive-quiz.tsx src/features/landing/components/client/interactive-quiz.tsx
mv src/features/student-redesign/components/client/faq-section.tsx src/features/landing/components/client/faq-section.tsx
mv src/features/student-redesign/components/client/whatsapp-button.tsx src/features/landing/components/client/whatsapp-button.tsx
mv src/features/student-redesign/components/client/video-modal.tsx src/features/landing/components/client/video-modal.tsx
mv src/features/student-redesign/components/client/auth-modal.tsx src/features/landing/components/client/auth-modal.tsx
mv src/features/student-redesign/components/server/hero.tsx src/features/landing/components/server/hero.tsx
mv src/features/student-redesign/components/server/subject-grid.tsx src/features/landing/components/server/subject-grid.tsx
mv src/features/student-redesign/components/server/featured-lessons.tsx src/features/landing/components/server/featured-lessons.tsx
mv src/features/student-redesign/components/server/bento-grid.tsx src/features/landing/components/server/bento-grid.tsx
mv src/features/student-redesign/components/server/comparison.tsx src/features/landing/components/server/comparison.tsx
mv src/features/student-redesign/components/server/mobile-app.tsx src/features/landing/components/server/mobile-app.tsx
mv src/features/student-redesign/components/server/final-cta.tsx src/features/landing/components/server/final-cta.tsx
mv src/features/student-redesign/components/server/footer.tsx src/features/landing/components/server/footer.tsx
mv src/features/student-redesign/components/server/testimonials.tsx src/features/landing/components/server/testimonials.tsx
mv src/features/student-redesign/components/server/features.tsx src/features/landing/components/server/features.tsx
mv src/features/student-redesign/components/server/teacher-join-cta.tsx src/features/landing/components/server/teacher-join-cta.tsx
mv src/features/student-redesign/data/mock-data.ts src/features/landing/data/mock-data.ts
mv src/features/student-redesign/types.ts src/features/landing/types.ts
```

- [ ] **Step 6: Update imports inside moved `landing` files from `../../types`, `../../data/mock-data`, and `./redesign.css` to the new `landing` paths**

```ts
import "./landing.css";
import type { TeacherSummary } from "../../types";
import { FAQ_ITEMS } from "../../data/mock-data";
```

- [ ] **Step 7: Re-run the focused landing E2E test and the auth-shell unit test**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "landing route still renders"`
Expected: PASS

Run: `npm run test:unit -- src/features/student-auth/components/auth-page-shell.test.tsx`
Expected: PASS

- [ ] **Step 8: Commit the landing ownership move**

```bash
git add src/app/[locale]/(student)/page.tsx src/features/landing
git commit -m "refactor: move landing route ownership into landing feature"
```

### Task 3: Create the `teachers` feature and move public teacher discovery/profile there

**Files:**
- Create: `src/features/teachers/components/client/browse-teachers-shell.tsx`
- Create: `src/features/teachers/components/client/browse-teachers-view.tsx`
- Create: `src/features/teachers/components/client/teacher-profile-shell.tsx`
- Create: `src/features/teachers/components/client/teacher-profile-view.tsx`
- Create: `src/features/teachers/components/client/teacher-modal.tsx`
- Create: `src/features/teachers/types.ts`
- Modify: `src/app/[locale]/browse-teachers/page.tsx`
- Modify: `src/app/[locale]/teachers/[id]/page.tsx`
- Test: `tests/e2e/app-smoke.spec.ts`

**Interfaces:**
- Consumes: `toTeacherSummary`, `toTeacher`, `getPublicTeacher`, `getPublicTeacherCourses`, `getPublicTeachers`; current shells under `student-redesign/components/client`
- Produces:
  - `TeachersBrowseShell` default export from `src/features/teachers/components/client/browse-teachers-shell.tsx`
  - `TeacherProfileShell` default export from `src/features/teachers/components/client/teacher-profile-shell.tsx`

- [ ] **Step 1: Write the failing E2E test for browse-teachers ownership**

```ts
import { expect, test } from "@playwright/test";

test("browse teachers route still renders after moving to the teachers feature", async ({ page }) => {
  await page.goto("/ar/browse-teachers");
  await expect(page.getByRole("heading", { level: 1, name: "جميع المدرسين" })).toBeVisible();
});
```

- [ ] **Step 2: Run the focused browse-teachers E2E test and capture the red state**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "browse teachers route still renders"`
Expected: FAIL after changing the route import to `@/src/features/teachers/components/client/browse-teachers-shell` before that file exists

- [ ] **Step 3: Create temporary re-export wrappers for the new feature owner**

```ts
// src/features/teachers/components/client/browse-teachers-shell.tsx
export { default } from "@/src/features/student-redesign/components/client/browse-teachers-shell";
```

```ts
// src/features/teachers/components/client/teacher-profile-shell.tsx
export { default } from "@/src/features/student-redesign/components/client/teacher-profile-shell";
```

- [ ] **Step 4: Update the route files to import from `teachers`**

```ts
// src/app/[locale]/browse-teachers/page.tsx
import BrowseTeachersShell from "@/src/features/teachers/components/client/browse-teachers-shell";
```

```ts
// src/app/[locale]/teachers/[id]/page.tsx
import TeacherProfileShell from "@/src/features/teachers/components/client/teacher-profile-shell";
```

- [ ] **Step 5: Re-run the focused browse-teachers E2E test**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "browse teachers route still renders"`
Expected: PASS

- [ ] **Step 6: Move the real browse/profile implementation files and types into `teachers`**

```bash
mv src/features/student-redesign/components/client/browse-teachers-shell.tsx src/features/teachers/components/client/browse-teachers-shell.tsx
mv src/features/student-redesign/components/client/browse-teachers-view.tsx src/features/teachers/components/client/browse-teachers-view.tsx
mv src/features/student-redesign/components/client/teacher-profile-shell.tsx src/features/teachers/components/client/teacher-profile-shell.tsx
mv src/features/student-redesign/components/client/teacher-profile-view.tsx src/features/teachers/components/client/teacher-profile-view.tsx
mv src/features/student-redesign/components/client/teacher-modal.tsx src/features/teachers/components/client/teacher-modal.tsx
mv src/features/student-redesign/types.ts src/features/teachers/types.ts
```

- [ ] **Step 7: Update moved imports from `../../types` to the local `teachers/types.ts`**

```ts
import type { TeacherSummary } from "../../types";
import type { Teacher } from "../../types";
```

- [ ] **Step 8: Re-run the focused browse and public teacher profile route tests**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "browse teachers route still renders|public teacher profile"`
Expected: PASS

- [ ] **Step 9: Commit the teachers ownership move**

```bash
git add src/app/[locale]/browse-teachers/page.tsx src/app/[locale]/teachers/[id]/page.tsx src/features/teachers
git commit -m "refactor: move public teacher pages into teachers feature"
```

### Task 4: Create the `courses` feature and move public discovery/detail there

**Files:**
- Create: `src/features/courses/components/explore-courses.tsx`
- Create: `src/features/courses/components/course-detail.tsx`
- Create: `src/features/courses/components/course-motion.ts`
- Modify: `src/app/[locale]/explore/page.tsx`
- Modify: `src/app/[locale]/courses/[courseId]/page.tsx`
- Test: `tests/e2e/app-smoke.spec.ts`

**Interfaces:**
- Consumes: `ExploreCourseEntry` type and `ExploreCourses` default export from the current portal feature; `CourseDetail` default export from the current portal feature
- Produces:
  - `ExploreCourses` default export from `src/features/courses/components/explore-courses.tsx`
  - `CourseDetail` default export from `src/features/courses/components/course-detail.tsx`

- [ ] **Step 1: Write the failing E2E test that `/explore` still resolves through the new feature owner**

```ts
import { expect, test } from "@playwright/test";

test("explore route still loads through the courses feature owner", async ({ page }) => {
  await page.goto("/ar/explore");
  await expect(page).not.toHaveURL(/\/ar\/login$/);
});
```

- [ ] **Step 2: Run the focused explore E2E test and capture the red state**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "explore route still loads through the courses feature owner"`
Expected: FAIL after the route import is repointed to a missing `courses` feature file

- [ ] **Step 3: Create temporary re-export wrappers for the `courses` owner**

```ts
// src/features/courses/components/explore-courses.tsx
export { default } from "@/src/features/student-portal/components/explore-courses";
export type { ExploreCourseEntry } from "@/src/features/student-portal/components/explore-courses";
```

```ts
// src/features/courses/components/course-detail.tsx
export { default } from "@/src/features/student-portal/components/course-detail";
```

- [ ] **Step 4: Update `/explore` and `/courses/[courseId]` to import from `courses`**

```ts
import ExploreCourses from "@/src/features/courses/components/explore-courses";
import CourseDetail from "@/src/features/courses/components/course-detail";
```

- [ ] **Step 5: Re-run the focused explore E2E test**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "explore route still loads through the courses feature owner"`
Expected: PASS

- [ ] **Step 6: Move the real public course files into `courses`**

```bash
mv src/features/student-portal/components/explore-courses.tsx src/features/courses/components/explore-courses.tsx
mv src/features/student-portal/components/course-detail.tsx src/features/courses/components/course-detail.tsx
mv src/features/student-portal/components/portal-motion.ts src/features/courses/components/course-motion.ts
```

- [ ] **Step 7: Update moved imports from `./portal-motion` and `./student-portal-shell`**

```ts
import { portalCardLiftClass, portalContainerVariants, portalImageZoomClass, portalItemVariants, scrollIntoViewById } from "./course-motion";
```

If `CourseDetail` and `ExploreCourses` still depend on `StudentPortalShell`, replace that shell dependency in a later task rather than broadening this one.

- [ ] **Step 8: Re-run the focused explore and course-detail route smoke tests**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "explore route still loads through the courses feature owner|course detail"`
Expected: PASS

- [ ] **Step 9: Commit the courses ownership move**

```bash
git add src/app/[locale]/explore/page.tsx src/app/[locale]/courses/[courseId]/page.tsx src/features/courses
git commit -m "refactor: move public course pages into courses feature"
```

### Task 5: Create the `dashboard` feature and move authenticated student app pages there

**Files:**
- Create: `src/features/dashboard/components/student-dashboard.tsx`
- Create: `src/features/dashboard/components/my-courses.tsx`
- Create: `src/features/dashboard/components/dashboard-shell.tsx`
- Create: `src/features/dashboard/components/dashboard-motion.ts`
- Modify: `src/app/[locale]/dashboard/page.tsx`
- Modify: `src/app/[locale]/my-courses/page.tsx`
- Test: `tests/e2e/app-smoke.spec.ts`

**Interfaces:**
- Consumes: current `StudentDashboard`, `MyCourses`, `StudentPortalShell`, and motion helpers from `student-portal`
- Produces:
  - `StudentDashboard` default export from `src/features/dashboard/components/student-dashboard.tsx`
  - `MyCourses` default export from `src/features/dashboard/components/my-courses.tsx`
  - `DashboardShell` default export from `src/features/dashboard/components/dashboard-shell.tsx`

- [ ] **Step 1: Write the failing E2E auth-guard regression tests**

```ts
import { expect, test } from "@playwright/test";

test("dashboard and my-courses stay auth-guarded after moving to the dashboard feature", async ({ page }) => {
  await page.goto("/ar/dashboard");
  await expect(page).toHaveURL(/\/ar\/login$/);

  await page.goto("/ar/my-courses");
  await expect(page).toHaveURL(/\/ar\/login$/);
});
```

- [ ] **Step 2: Run the focused auth-guard E2E test and capture the red state**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "dashboard and my-courses stay auth-guarded"`
Expected: FAIL after the route imports are changed to `dashboard` before the new files exist

- [ ] **Step 3: Create temporary re-export wrappers under `dashboard`**

```ts
export { default } from "@/src/features/student-portal/components/student-dashboard";
```

```ts
export { default } from "@/src/features/student-portal/components/my-courses";
```

- [ ] **Step 4: Update the route files to import from `dashboard`**

```ts
import StudentDashboard from "@/src/features/dashboard/components/student-dashboard";
import MyCourses from "@/src/features/dashboard/components/my-courses";
```

- [ ] **Step 5: Re-run the focused auth-guard E2E test**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "dashboard and my-courses stay auth-guarded"`
Expected: PASS

- [ ] **Step 6: Move the real authenticated files into `dashboard`**

```bash
mv src/features/student-portal/components/student-dashboard.tsx src/features/dashboard/components/student-dashboard.tsx
mv src/features/student-portal/components/my-courses.tsx src/features/dashboard/components/my-courses.tsx
mv src/features/student-portal/components/student-portal-shell.tsx src/features/dashboard/components/dashboard-shell.tsx
mv src/features/student-portal/components/portal-motion.ts src/features/dashboard/components/dashboard-motion.ts
```

- [ ] **Step 7: Update moved imports from portal-relative paths to dashboard-relative paths**

```ts
import DashboardShell from "./dashboard-shell";
import { portalContainerVariants, portalItemVariants } from "./dashboard-motion";
```

- [ ] **Step 8: Re-run the focused auth-guard E2E test**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "dashboard and my-courses stay auth-guarded"`
Expected: PASS

- [ ] **Step 9: Commit the dashboard ownership move**

```bash
git add src/app/[locale]/dashboard/page.tsx src/app/[locale]/my-courses/page.tsx src/features/dashboard
git commit -m "refactor: move authenticated student pages into dashboard feature"
```

### Task 6: Create the `teacher-marketing` feature and move `/teachers` to `/for-teachers`

**Files:**
- Create: `src/features/teacher-marketing/page.tsx`
- Create: `src/app/[locale]/for-teachers/page.tsx`
- Modify: `src/app/[locale]/teachers/page.tsx`
- Test: `tests/e2e/app-smoke.spec.ts`

**Interfaces:**
- Consumes: current teacher-marketing page sections imported from `src/features/marketing/components/*`
- Produces:
  - `TeacherMarketingPage` default export from `src/features/teacher-marketing/page.tsx`
  - `/[locale]/for-teachers` route
  - redirect or route replacement logic for the old `/[locale]/teachers` marketing entrypoint

- [ ] **Step 1: Write the failing E2E redirect test for the marketing route move**

```ts
import { expect, test } from "@playwright/test";

test("teacher marketing moves to /for-teachers", async ({ page }) => {
  await page.goto("/ar/for-teachers");
  await expect(page).toHaveURL(/\/ar\/for-teachers$/);
});
```

- [ ] **Step 2: Run the focused `/for-teachers` E2E test and capture the red state**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "teacher marketing moves to /for-teachers"`
Expected: FAIL because `/for-teachers` does not exist yet

- [ ] **Step 3: Create the new `teacher-marketing` page owner and the `/for-teachers` route**

```ts
// src/features/teacher-marketing/page.tsx
export { default } from "@/src/app/[locale]/teachers/page";
```

```ts
// src/app/[locale]/for-teachers/page.tsx
import TeacherMarketingPage from "@/src/features/teacher-marketing/page";

export default function ForTeachersPage() {
  return <TeacherMarketingPage />;
}
```

- [ ] **Step 4: Re-run the focused `/for-teachers` E2E test**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "teacher marketing moves to /for-teachers"`
Expected: PASS

- [ ] **Step 5: Move the actual teacher-marketing page implementation out of the route file**

```tsx
// src/features/teacher-marketing/page.tsx
import Header from "@/src/features/marketing/components/header";
import Hero from "@/src/features/marketing/components/hero";
// ...keep the existing page composition here...
```

```tsx
// src/app/[locale]/teachers/page.tsx
import { redirect } from "next/navigation";

export default async function TeachersLegacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(locale === "ar" ? "/for-teachers" : `/${locale}/for-teachers`);
}
```

- [ ] **Step 6: Re-run focused E2E coverage for `/for-teachers` and the old `/teachers` path**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "teacher marketing moves to /for-teachers|legacy teachers marketing"`
Expected: PASS

- [ ] **Step 7: Commit the teacher-marketing move**

```bash
git add src/features/teacher-marketing/page.tsx src/app/[locale]/for-teachers/page.tsx src/app/[locale]/teachers/page.tsx
git commit -m "refactor: move teacher marketing to for-teachers"
```

### Task 7: Make `/teachers` the canonical public teacher area and retire duplicates

**Files:**
- Modify: `src/app/[locale]/teachers/page.tsx`
- Modify: `src/app/[locale]/browse-teachers/page.tsx`
- Modify: `src/app/[locale]/explore/teachers/[id]/page.tsx`
- Test: `tests/e2e/app-smoke.spec.ts`

**Interfaces:**
- Consumes: `BrowseTeachersShell` from `src/features/teachers/components/client/browse-teachers-shell`
- Produces:
  - `/[locale]/teachers` public discovery route
  - `/[locale]/browse-teachers` redirect to `/[locale]/teachers`
  - `/[locale]/explore/teachers/[id]` redirect to `/[locale]/teachers/[id]`

- [ ] **Step 1: Write the failing E2E tests for canonical teacher routes**

```ts
import { expect, test } from "@playwright/test";

test("teachers becomes the canonical public teacher area", async ({ page }) => {
  await page.goto("/ar/teachers");
  await expect(page.getByRole("heading", { level: 1, name: "جميع المدرسين" })).toBeVisible();

  await page.goto("/ar/browse-teachers");
  await expect(page).toHaveURL(/\/ar\/teachers$/);
});
```

- [ ] **Step 2: Run the focused teacher-route E2E test and capture the red state**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "teachers becomes the canonical public teacher area"`
Expected: FAIL because `/teachers` still redirects to marketing or does not yet render the browse-teachers experience

- [ ] **Step 3: Make `/teachers` render the public browse page and convert old duplicate routes to redirects**

```ts
// src/app/[locale]/teachers/page.tsx
import BrowseTeachersPage from "@/src/app/[locale]/browse-teachers/page";
```

```ts
// src/app/[locale]/browse-teachers/page.tsx
import { redirect } from "next/navigation";
```

```ts
// src/app/[locale]/explore/teachers/[id]/page.tsx
import { redirect } from "next/navigation";
```

- [ ] **Step 4: Re-run the focused teacher-route E2E test**

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "teachers becomes the canonical public teacher area"`
Expected: PASS

- [ ] **Step 5: Commit the canonical teacher route consolidation**

```bash
git add src/app/[locale]/teachers/page.tsx src/app/[locale]/browse-teachers/page.tsx src/app/[locale]/explore/teachers/[id]/page.tsx
git commit -m "refactor: consolidate public teacher routes"
```

### Task 8: Extract only proven shared code and remove retired feature trees

**Files:**
- Create: `src/features/shared/` subpaths only for code now imported by 2+ top-level features
- Modify: imports in `landing`, `teachers`, `courses`, `dashboard`
- Delete: `src/features/student-landing/`
- Delete: `src/features/student-redesign/`
- Delete: `src/features/student-portal/`
- Test: `tests/e2e/app-smoke.spec.ts`, focused unit tests for extracted shared code

**Interfaces:**
- Consumes: all migrated top-level features from previous tasks
- Produces:
  - no remaining imports from `student-landing`, `student-redesign`, or `student-portal`
  - `shared` exports only stable, multi-feature code with explicit import sites

- [ ] **Step 1: Write the failing unit tests for any code extracted into `shared` before moving callers**

```tsx
import { describe, expect, it } from "vitest";
import { cn } from "@/src/lib/cn";

describe("shared extraction guard", () => {
  it("only extracts helpers with stable behavior", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
```

Use real extracted shared interfaces here; do not add a `shared` file without a focused test first.

- [ ] **Step 2: Run the focused shared-unit test to capture the red state for the first extracted interface**

Run: `npm run test:unit -- <path-to-new-shared-test>`
Expected: FAIL because the new shared module or export path does not exist yet

- [ ] **Step 3: Move only genuinely shared files into `src/features/shared/` and update import sites**

```bash
rg -n "student-landing|student-redesign|student-portal" src
```

Use this search to drive deletions only after every remaining import has been repointed.

- [ ] **Step 4: Re-run the focused shared-unit tests and the full route smoke suite**

Run: `npm run test:unit`
Expected: PASS

Run: `npm run test:e2e -- tests/e2e/app-smoke.spec.ts`
Expected: PASS

- [ ] **Step 5: Delete the retired feature trees once no imports remain**

```bash
rmdir src/features/student-landing
rmdir src/features/student-redesign
rmdir src/features/student-portal
```

If the directories are not empty, stop and remove the remaining files by moving or deleting them deliberately rather than force-deleting blindly.

- [ ] **Step 6: Verify no active imports reference retired feature owners**

Run: `rg -n "student-landing|student-redesign|student-portal" src/app src/features`
Expected: no active runtime imports; historical docs may still mention them

- [ ] **Step 7: Run the final verification set**

Run: `npm run test`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 8: Commit the shared extraction and legacy retirement**

```bash
git add src/features/shared src/app src/features
git commit -m "refactor: retire legacy student feature trees"
```
