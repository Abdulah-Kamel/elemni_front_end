# Feature Root Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the remaining misnamed feature roots to `auth` and `onboarding`, move teacher-acquisition page ownership fully into `marketing`, and delete the old roots without changing runtime behavior.

**Architecture:** This cutover proceeds in thin vertical slices: first move the `/for-teachers` owner into `marketing`, then move auth, then onboarding, and finally delete the retired roots after an explicit stale-import scan. The repository is already dirty, so every move must preserve current file contents and local edits; no compatibility wrappers or opportunistic cleanup are allowed.

**Tech Stack:** Next.js 16.2.10 App Router, React 19, TypeScript 5, next-intl 4, Vitest, React Testing Library, Playwright

**Spec:** `docs/superpowers/specs/2026-08-22-feature-root-cutover-design.md`

## Global Constraints

- Keep a feature-first folder structure.
- Perform a direct cutover with no compatibility wrappers, no re-export bridges, and no transitional duplicate roots.
- Preserve current runtime behavior for auth, onboarding, and teacher marketing.
- Move dirty files with their current contents intact; do not mix unrelated cleanup into moved files.
- Do not rename runtime storage keys such as `elemni-student-onboarding-v1` in this pass.
- Do not perform broad symbol-renaming cleanup unless required for correctness.
- Read the relevant Next.js 16.2.10 guides under `node_modules/next/dist/docs/` before editing App Router route or test files.
- Use `PLAYWRIGHT_PORT=3101` for E2E commands in this environment to avoid the unrelated app bound to port 3000.
- Run verification sequentially: `npm run test` first, then `npm run build`.
- No production refactor code without a failing test or an already-written preserved-behavior characterization test that is then driven red by the cutover step.

---

## File Structure

- `src/features/marketing/page.tsx` — new canonical page owner for `/for-teachers`, including metadata and section composition.
- `src/features/auth/components/*` — canonical home for auth shell, auth forms, and auth-specific colocated tests.
- `src/features/onboarding/*` — canonical home for onboarding flow and onboarding draft helper.
- `src/app/[locale]/*/page.tsx` — thin route owners that import only from their canonical feature roots.
- `tests/e2e/app-smoke.spec.ts` — route-level characterization tests for `/for-teachers`, auth routes, onboarding, and existing authenticated flows.
- `src/features/auth/components/auth-page-shell.test.tsx` — focused unit characterization for the auth shell after its root move.

### Task 1: Move `/for-teachers` ownership from `teacher-marketing` into `marketing`

**Files:**
- Create: `src/features/marketing/page.tsx`
- Modify: `src/app/[locale]/for-teachers/page.tsx`
- Modify: `tests/e2e/app-smoke.spec.ts`
- Delete: `src/features/teacher-marketing/page.tsx`

**Interfaces:**
- Consumes:
  - `Header`, `Hero`, `StatsBar`, `FeaturesGrid`, `HlsSection`, `CurriculumSection`, `VideoDemoSection`, `PaymentsSection`, `ComparisonTable`, `BeforeAfter`, `StepsSection`, `MigrationSection`, `Testimonials`, `PricingSection`, `FaqSection`, `FinalCta`, `Footer` from `src/features/marketing/components/*`
  - `getTranslations` and `setRequestLocale` from `next-intl/server`
- Produces:
  - `generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<{ title: string; description: string }>` from `src/features/marketing/page.tsx`
  - default export `TeacherMarketingPage({ params }: { params: Promise<{ locale: string }> })` from `src/features/marketing/page.tsx`
  - `/for-teachers` route importing only from `src/features/marketing/page`

- [ ] **Step 1: Ensure the focused `/for-teachers` smoke test exists**

```ts
test("teacher marketing moves to /for-teachers", async ({ page }) => {
  await page.goto("/for-teachers");
  await expect(page).toHaveURL(/\/for-teachers$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "بطّل تبيع دروسك في جروبات الواتساب",
    }),
  ).toBeVisible();
});
```

- [ ] **Step 2: Repoint the route to the future `marketing` owner before that file exists**

```ts
// src/app/[locale]/for-teachers/page.tsx
import TeacherMarketingPage from "@/src/features/marketing/page";

export { generateMetadata } from "@/src/features/marketing/page";

export default async function ForTeachersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return <TeacherMarketingPage params={params} />;
}
```

- [ ] **Step 3: Run the focused smoke to verify the route is red**

Run: `PLAYWRIGHT_PORT=3101 npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep 'teacher marketing moves to /for-teachers'`

Expected: FAIL during build or route resolution because `src/features/marketing/page.tsx` does not exist yet

- [ ] **Step 4: Move the page owner into `marketing`**

```bash
mkdir -p src/features/marketing
git mv src/features/teacher-marketing/page.tsx src/features/marketing/page.tsx
```

```ts
// src/features/marketing/page.tsx
type TeacherMarketingPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TeacherMarketingPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "teachers.meta" });
  return { title: t("title"), description: t("description") };
}

export default async function TeacherMarketingPage({ params }: TeacherMarketingPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Header />
      <main>
        <Hero />
        <StatsBar />
        <FeaturesGrid />
        <HlsSection />
        <CurriculumSection />
        <VideoDemoSection />
        <PaymentsSection />
        <ComparisonTable />
        <BeforeAfter />
        <StepsSection />
        <MigrationSection />
        <Testimonials />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 5: Re-run the focused smoke to verify green**

Run: `PLAYWRIGHT_PORT=3101 npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep 'teacher marketing moves to /for-teachers'`

Expected: PASS

- [ ] **Step 6: Commit the marketing cutover**

```bash
git add src/features/marketing/page.tsx src/app/[locale]/for-teachers/page.tsx tests/e2e/app-smoke.spec.ts
git commit -m "refactor: move for-teachers ownership into marketing"
```

### Task 2: Move auth ownership from `student-auth` to `auth`

**Files:**
- Create: `src/features/auth/components/auth-card.tsx`
- Create: `src/features/auth/components/auth-chrome.tsx`
- Create: `src/features/auth/components/auth-page-shell.tsx`
- Create: `src/features/auth/components/auth-page-shell.test.tsx`
- Create: `src/features/auth/components/password-recovery-form.tsx`
- Create: `src/features/auth/components/student-auth-form.tsx`
- Modify: `src/app/[locale]/login/page.tsx`
- Modify: `src/app/[locale]/register/page.tsx`
- Modify: `src/app/[locale]/forgot-password/page.tsx`
- Modify: `src/app/[locale]/reset-password/page.tsx`
- Modify: `tests/e2e/app-smoke.spec.ts`
- Delete: `src/features/student-auth/components/auth-card.tsx`
- Delete: `src/features/student-auth/components/auth-chrome.tsx`
- Delete: `src/features/student-auth/components/auth-page-shell.tsx`
- Delete: `src/features/student-auth/components/auth-page-shell.test.tsx`
- Delete: `src/features/student-auth/components/password-recovery-form.tsx`
- Delete: `src/features/student-auth/components/student-auth-form.tsx`

**Interfaces:**
- Consumes:
  - `AuthPageShell({ children, locale }: { children: React.ReactNode; locale: string })`
  - `StudentAuthForm({ mode }: { mode: "login" | "register" })`
  - `ForgotPasswordForm()`
  - `ResetPasswordForm({ token }: { token: string })`
- Produces the same exports, unchanged except for path:
  - default export `AuthPageShell` from `src/features/auth/components/auth-page-shell.tsx`
  - default export `StudentAuthForm` from `src/features/auth/components/student-auth-form.tsx`
  - named exports `ForgotPasswordForm` and `ResetPasswordForm` from `src/features/auth/components/password-recovery-form.tsx`

- [ ] **Step 1: Add a focused auth-route characterization test**

```ts
test("auth routes still render after moving to auth feature", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { level: 1, name: "أهلاً بيك من تاني" }),
  ).toBeVisible();

  await page.goto("/register");
  await expect(
    page.getByRole("heading", { level: 1, name: "إنشاء حساب جديد" }),
  ).toBeVisible();

  await page.goto("/forgot-password");
  await expect(
    page.getByRole("heading", { level: 1, name: "استعادة كلمة المرور" }),
  ).toBeVisible();

  await page.goto("/reset-password?token=demo-token");
  await expect(
    page.getByRole("heading", { level: 1, name: "كلمة مرور جديدة" }),
  ).toBeVisible();
});
```

- [ ] **Step 2: Repoint the auth routes to `features/auth` before the root exists**

```ts
// src/app/[locale]/login/page.tsx
import AuthPageShell from "@/src/features/auth/components/auth-page-shell";
import StudentAuthForm from "@/src/features/auth/components/student-auth-form";

// src/app/[locale]/register/page.tsx
import AuthPageShell from "@/src/features/auth/components/auth-page-shell";
import StudentAuthForm from "@/src/features/auth/components/student-auth-form";

// src/app/[locale]/forgot-password/page.tsx
import AuthPageShell from "@/src/features/auth/components/auth-page-shell";
import { ForgotPasswordForm } from "@/src/features/auth/components/password-recovery-form";

// src/app/[locale]/reset-password/page.tsx
import AuthPageShell from "@/src/features/auth/components/auth-page-shell";
import { ResetPasswordForm } from "@/src/features/auth/components/password-recovery-form";
```

- [ ] **Step 3: Run focused auth verification to confirm the cutover is red**

Run: `PLAYWRIGHT_PORT=3101 npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep 'auth routes still render after moving to auth feature'`

Expected: FAIL during build or route resolution because `src/features/auth/components/*` does not exist yet

- [ ] **Step 4: Move the auth files intact into the new root**

```bash
mkdir -p src/features/auth/components
git mv src/features/student-auth/components/auth-card.tsx src/features/auth/components/auth-card.tsx
git mv src/features/student-auth/components/auth-chrome.tsx src/features/auth/components/auth-chrome.tsx
git mv src/features/student-auth/components/auth-page-shell.tsx src/features/auth/components/auth-page-shell.tsx
git mv src/features/student-auth/components/auth-page-shell.test.tsx src/features/auth/components/auth-page-shell.test.tsx
git mv src/features/student-auth/components/password-recovery-form.tsx src/features/auth/components/password-recovery-form.tsx
git mv src/features/student-auth/components/student-auth-form.tsx src/features/auth/components/student-auth-form.tsx
```

```ts
// src/features/auth/components/auth-page-shell.test.tsx
import AuthPageShell from "./auth-page-shell";
```

- [ ] **Step 5: Run the focused unit and auth-route tests to verify green**

Run: `npm run test:unit -- src/features/auth/components/auth-page-shell.test.tsx`

Expected: PASS

Run: `PLAYWRIGHT_PORT=3101 npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep 'auth routes still render after moving to auth feature'`

Expected: PASS

- [ ] **Step 6: Commit the auth cutover**

```bash
git add src/features/auth src/app/[locale]/login/page.tsx src/app/[locale]/register/page.tsx src/app/[locale]/forgot-password/page.tsx src/app/[locale]/reset-password/page.tsx tests/e2e/app-smoke.spec.ts
git commit -m "refactor: move auth ownership to auth feature"
```

### Task 3: Move onboarding ownership from `student-onboarding` to `onboarding`

**Files:**
- Create: `src/features/onboarding/client.ts`
- Create: `src/features/onboarding/components/onboarding-flow.tsx`
- Modify: `src/app/[locale]/onboarding/page.tsx`
- Modify: `tests/e2e/app-smoke.spec.ts`
- Delete: `src/features/student-onboarding/client.ts`
- Delete: `src/features/student-onboarding/components/onboarding-flow.tsx`

**Interfaces:**
- Consumes:
  - default export `OnboardingFlow({ grades, streams, subjects }: { grades: GradeDto[]; streams: StreamDto[]; subjects: SubjectDto[] })`
  - `saveStudentOnboarding(payload: StudentOnboardingPayload): Promise<void>`
  - `StudentOnboardingPayload = { grade_id: number; stream_id: number; subject_ids: number[] }`
- Produces the same exports, unchanged except for path:
  - `saveStudentOnboarding` from `src/features/onboarding/client.ts`
  - default export `OnboardingFlow` from `src/features/onboarding/components/onboarding-flow.tsx`

- [ ] **Step 1: Add a focused onboarding-route characterization test**

```ts
test("onboarding stays auth-guarded after moving to onboarding feature", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/login$/);
});
```

- [ ] **Step 2: Repoint the onboarding route to `features/onboarding` before the root exists**

```ts
// src/app/[locale]/onboarding/page.tsx
import OnboardingFlow from "@/src/features/onboarding/components/onboarding-flow";
```

- [ ] **Step 3: Run focused onboarding verification to confirm the cutover is red**

Run: `PLAYWRIGHT_PORT=3101 npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep 'onboarding stays auth-guarded after moving to onboarding feature|a freshly registered student can open migrated authenticated surfaces and see canonical teacher links'`

Expected: FAIL during build or route resolution because `src/features/onboarding/components/onboarding-flow.tsx` does not exist yet

- [ ] **Step 4: Move the onboarding files intact into the new root**

```bash
mkdir -p src/features/onboarding/components
git mv src/features/student-onboarding/client.ts src/features/onboarding/client.ts
git mv src/features/student-onboarding/components/onboarding-flow.tsx src/features/onboarding/components/onboarding-flow.tsx
```

```ts
// src/features/onboarding/components/onboarding-flow.tsx
import { saveStudentOnboarding } from "../client";
```

- [ ] **Step 5: Run the focused onboarding tests to verify green**

Run: `PLAYWRIGHT_PORT=3101 npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep 'onboarding stays auth-guarded after moving to onboarding feature|a freshly registered student can open migrated authenticated surfaces and see canonical teacher links'`

Expected: PASS

- [ ] **Step 6: Commit the onboarding cutover**

```bash
git add src/features/onboarding src/app/[locale]/onboarding/page.tsx tests/e2e/app-smoke.spec.ts
git commit -m "refactor: move onboarding ownership to onboarding feature"
```

### Task 4: Delete retired roots, remove stale references, and run full verification

**Files:**
- Modify: `src/app/[locale]/for-teachers/page.tsx`
- Modify: `src/app/[locale]/login/page.tsx`
- Modify: `src/app/[locale]/register/page.tsx`
- Modify: `src/app/[locale]/forgot-password/page.tsx`
- Modify: `src/app/[locale]/reset-password/page.tsx`
- Modify: `src/app/[locale]/onboarding/page.tsx`
- Modify: any remaining import site still referencing old roots
- Delete: `src/features/student-auth/`
- Delete: `src/features/student-onboarding/`
- Delete: `src/features/teacher-marketing/`

**Interfaces:**
- Consumes:
  - canonical imports from `src/features/marketing/page`
  - canonical imports from `src/features/auth/components/*`
  - canonical imports from `src/features/onboarding/components/onboarding-flow`
- Produces:
  - no remaining active imports from `features/student-auth`, `features/student-onboarding`, or `features/teacher-marketing`
  - clean route-owner graph using only canonical roots

- [ ] **Step 1: Capture the red stale-reference scan before final deletion**

Run: `rg -n 'features/student-auth|features/student-onboarding|features/teacher-marketing' src tests`

Expected: MATCHES present if any route, test, or feature file still references the retired roots

- [ ] **Step 2: Remove any remaining stale imports and delete the retired roots**

```bash
rg -n 'features/student-auth|features/student-onboarding|features/teacher-marketing' src tests
rmdir src/features/teacher-marketing 2>/dev/null || true
rmdir src/features/student-onboarding/components 2>/dev/null || true
rmdir src/features/student-onboarding 2>/dev/null || true
rmdir src/features/student-auth/components 2>/dev/null || true
rmdir src/features/student-auth 2>/dev/null || true
```

```ts
// Every remaining route import should now point only at:
// "@/src/features/marketing/page"
// "@/src/features/auth/components/..."
// "@/src/features/onboarding/components/onboarding-flow"
```

- [ ] **Step 3: Re-run the stale-reference scan to verify green**

Run: `rg -n 'features/student-auth|features/student-onboarding|features/teacher-marketing' src tests`

Expected: no output, exit code 1

- [ ] **Step 4: Run full verification sequentially**

Run: `PLAYWRIGHT_PORT=3101 npm run test`

Expected: PASS (2 unit tests, 10 E2E tests, or the updated total if Task 2 and Task 3 added new smoke cases)

Run: `npm run build`

Expected: PASS

- [ ] **Step 5: Commit the final cleanup**

```bash
git add src/app/[locale]/for-teachers/page.tsx src/app/[locale]/login/page.tsx src/app/[locale]/register/page.tsx src/app/[locale]/forgot-password/page.tsx src/app/[locale]/reset-password/page.tsx src/app/[locale]/onboarding/page.tsx src/features/marketing src/features/auth src/features/onboarding tests/e2e/app-smoke.spec.ts
git commit -m "refactor: complete feature root cutover"
```
