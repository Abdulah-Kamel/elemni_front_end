# Feature Root Cutover Design

Date: 2026-08-22
Status: Approved in chat for spec writing
Scope: Architectural refactor of feature-root ownership names only

## Summary

This pass performs a direct cutover of the remaining misnamed or redundant feature roots:

- `src/features/student-auth` → `src/features/auth`
- `src/features/student-onboarding` → `src/features/onboarding`
- `src/features/teacher-marketing` removed; its page entry moves into `src/features/marketing`

The goal is to align feature ownership with the current product boundaries without mixing in behavior changes or broad internal cleanup. The repository is already dirty, including local edits inside `student-auth`, so this pass is constrained to move-and-repoint work only.

## Context

The previous ownership refactor already completed the larger surface moves:

- `landing` owns the public landing experience
- `teachers` owns teacher discovery and public teacher profiles
- `courses` owns public course-facing pages
- `dashboard` owns authenticated student dashboard pages
- `shared` holds only proven cross-feature student shell pieces

What remains inconsistent is feature-root naming and a redundant teacher-marketing wrapper:

- auth is student-only, but still lives under `student-auth`
- onboarding is student-only, but still lives under `student-onboarding`
- teacher acquisition is split between `marketing` components/data and a `teacher-marketing` page wrapper

The user explicitly wants:

- student-only naming to become generic (`auth`, `onboarding`)
- teacher acquisition to be owned fully by `marketing`
- direct cutover, not compatibility wrappers

## Goals

1. Rename the remaining student-prefixed feature roots to their final names:
   - `auth`
   - `onboarding`
2. Remove `teacher-marketing` entirely and make `marketing` own the full teacher-acquisition surface.
3. Repoint all imports and route entries in one pass.
4. Delete the old roots immediately after all references are updated.
5. Preserve current runtime behavior.

## Non-Goals

This pass does not:

- change auth, onboarding, or marketing behavior
- redesign forms, copy, validation, or page flow
- rename runtime storage keys such as `elemni-student-onboarding-v1`
- perform broad symbol-renaming cleanup inside moved files unless required for correctness
- revisit `teachers`, `courses`, `dashboard`, or `landing` ownership boundaries
- perform new shared extraction work

## Current State

Current relevant feature roots:

- `src/features/student-auth`
- `src/features/student-onboarding`
- `src/features/marketing`
- `src/features/teacher-marketing`

Current route ownership:

- `/login`, `/register`, `/forgot-password`, `/reset-password` import from `student-auth`
- `/onboarding` imports from `student-onboarding`
- `/for-teachers` imports from `teacher-marketing`

Current local-worktree constraint:

- `src/features/student-auth/components/password-recovery-form.tsx` is modified locally
- `src/features/student-auth/components/student-auth-form.tsx` is modified locally

Those edits are user-owned unless proven otherwise, so this refactor must move them intact rather than rewrite them opportunistically.

## Target Architecture

### Final Feature Roots

- `src/features/auth`
- `src/features/onboarding`
- `src/features/marketing`

Removed roots:

- `src/features/student-auth`
- `src/features/student-onboarding`
- `src/features/teacher-marketing`

### Ownership Boundaries

#### `auth`

Owns:

- auth page shell/chrome
- login/register forms
- password recovery and reset forms
- auth-specific tests colocated with auth UI

Does not own:

- onboarding
- student dashboard shell
- generic landing/marketing content

#### `onboarding`

Owns:

- onboarding flow UI
- onboarding client draft helpers

Does not own:

- login/register/reset views
- dashboard or discovery pages

#### `marketing`

Owns:

- teacher acquisition page entry for `/for-teachers`
- metadata generation for that page
- marketing sections and marketing data used by that page

Does not own:

- teacher discovery
- public teacher profile routes
- student landing page ownership

## Planned File Moves

### Auth

Move:

- `src/features/student-auth/components/auth-card.tsx`
- `src/features/student-auth/components/auth-chrome.tsx`
- `src/features/student-auth/components/auth-page-shell.tsx`
- `src/features/student-auth/components/auth-page-shell.test.tsx`
- `src/features/student-auth/components/password-recovery-form.tsx`
- `src/features/student-auth/components/student-auth-form.tsx`

To:

- `src/features/auth/components/...`

### Onboarding

Move:

- `src/features/student-onboarding/client.ts`
- `src/features/student-onboarding/components/onboarding-flow.tsx`

To:

- `src/features/onboarding/...`

### Marketing

Move:

- `src/features/teacher-marketing/page.tsx`

To:

- `src/features/marketing/page.tsx`

Retain existing marketing-owned components/data in place:

- `src/features/marketing/components/*`
- `src/features/marketing/data.ts`

Delete after repointing:

- `src/features/teacher-marketing`

## Route Import Cutover

### Auth routes

Update these route entries to import from `src/features/auth`:

- `src/app/[locale]/login/page.tsx`
- `src/app/[locale]/register/page.tsx`
- `src/app/[locale]/forgot-password/page.tsx`
- `src/app/[locale]/reset-password/page.tsx`

### Onboarding route

Update this route entry to import from `src/features/onboarding`:

- `src/app/[locale]/onboarding/page.tsx`

### Teacher acquisition route

Update this route entry to import from `src/features/marketing/page`:

- `src/app/[locale]/for-teachers/page.tsx`

It should re-export metadata from `src/features/marketing/page` and render that feature directly.

## Direct Cutover Rules

Because the user chose direct cutover:

- no compatibility wrappers
- no re-export bridges at old paths
- no transitional duplicate roots
- old paths must be deleted in the same pass once imports are repointed

Because the repo is dirty:

- move files with their current contents intact
- do not normalize formatting or rename internal symbols in dirty files unless required for the path cutover
- keep the diff focused on filesystem ownership and imports

## Execution Order

1. Add or tighten tests that protect the cutover boundary.
2. Move `teacher-marketing/page.tsx` into `marketing/page.tsx`.
3. Repoint `/for-teachers` to `marketing/page.tsx`.
4. Move `student-auth` into `auth`.
5. Repoint all auth route entries.
6. Move `student-onboarding` into `onboarding`.
7. Repoint `/onboarding`.
8. Search for stale imports or references to:
   - `student-auth`
   - `student-onboarding`
   - `teacher-marketing`
9. Delete the old roots.
10. Run focused verification, then full verification.

This order cuts the smallest independent surface first (`teacher-marketing`), then the larger but still isolated auth/onboarding roots.

## Testing Strategy

This refactor uses TDD at the boundary level. The tests should prove that the route owners still work after the import/root moves.

### Focused checks

- no remaining imports or references to:
  - `src/features/student-auth`
  - `src/features/student-onboarding`
  - `src/features/teacher-marketing`
- auth shell test still passes from the new root
- `/for-teachers` route still renders correctly
- `/login`, `/register`, `/forgot-password`, `/reset-password` still render correctly
- `/onboarding` still preserves current auth-gated behavior

### Full verification

Run sequentially:

1. `npm run test`
2. `npm run build`

Sequential execution matters because concurrent Next build/test runs have already caused build-process conflicts in this environment.

## Risks and Mitigations

### Risk: local user edits inside `student-auth`

If the cutover rewrites those files instead of moving them as-is, it can clobber user work.

Mitigation:

- treat `password-recovery-form.tsx` and `student-auth-form.tsx` as move-only unless import/path updates are required
- keep unrelated hunks out of commits

### Risk: import/path misses after direct deletion

Without wrappers, a missed import becomes a hard failure.

Mitigation:

- search the tree explicitly for stale roots before deletion
- verify route entries individually before full suite execution

### Risk: accidental semantic cleanup broadens scope

Renaming internal symbols during root moves adds noise and risk.

Mitigation:

- root cutover first
- semantic/internal naming cleanup deferred to a later pass

## Acceptance Criteria

This pass is complete when all of the following are true:

1. `src/features/auth` exists and `src/features/student-auth` does not.
2. `src/features/onboarding` exists and `src/features/student-onboarding` does not.
3. `src/features/marketing/page.tsx` owns the teacher-acquisition page entry.
4. `src/features/teacher-marketing` no longer exists.
5. All route entries import from the new roots.
6. A repo-wide search finds no remaining references to the removed roots.
7. Focused route/auth verification passes.
8. `npm run test` passes.
9. `npm run build` passes.

## Follow-Up Work Explicitly Deferred

These are intentionally left for later passes:

- renaming internal symbols such as `StudentAuthForm` or `TeacherMarketingPage`
- revisiting whether `marketing` should eventually be renamed for broader non-teacher use
- cleanup of runtime strings/keys that still contain `student`
- deeper shared-boundary cleanup across auth/landing/marketing
