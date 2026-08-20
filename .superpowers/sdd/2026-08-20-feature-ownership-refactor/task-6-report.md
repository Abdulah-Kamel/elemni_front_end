# Task 6 report: teacher marketing feature ownership

## Delivered

- Created `src/features/teacher-marketing/page.tsx` as the owner of the teacher-marketing composition and its locale-aware metadata.
- Added `src/app/[locale]/for-teachers/page.tsx`, forwarding the route `params` to the feature and re-exporting its metadata generator.
- Replaced the old `/[locale]/teachers` marketing page with a locale-aware legacy redirect:
  - Arabic default locale: `/teachers` → `/for-teachers`
  - Other locales: `/{locale}/teachers` → `/{locale}/for-teachers`
- Extended `tests/e2e/app-smoke.spec.ts` with canonical-route and legacy-redirect smoke coverage.

## TDD evidence

1. Added the `/for-teachers` smoke test first. It failed because the route did not render the expected teacher-marketing hero.
2. Added the legacy `/teachers` redirect test before implementing the redirect. The focused run failed because `/teachers` remained at its original URL.
3. Implemented the feature owner, canonical route, and redirect. The focused run passed: 2/2 tests.

## Brief conflict and resolution

The brief's Step 3 intermediate re-export would have invoked the existing route page without its required `params: Promise<{ locale: string }>` prop. The coordinating agent approved the compatible bridge: the feature owner retains that prop shape; the new route forwards it; and the feature owns `setRequestLocale` plus metadata generation. This preserves the current runtime behavior while completing the requested ownership move.

## Verification

- `npm run test:e2e -- tests/e2e/app-smoke.spec.ts --grep "teacher marketing moves to /for-teachers|legacy teachers marketing"` — passed (2/2).
- `npm run test:e2e -- tests/e2e/app-smoke.spec.ts` — passed (8/8).
- `npm run build` — passed; the route manifest contains both `/[locale]/for-teachers` and `/[locale]/teachers`.
- `npm run lint` — blocked by 24 existing errors in unrelated landing and student-redesign files. No lint errors were reported for Task 6 files.

## Scope and worktree hygiene

Only the four Task 6 source/test files and this report are staged/committed for this task. Existing unrelated worktree changes, including `.specify/` changes and unrelated feature edits, were preserved.
