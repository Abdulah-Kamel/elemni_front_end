# Feature Ownership Refactor

**Date:** 2026-08-20
**Status:** Design proposed for review

## Overview

Refactor the frontend from history-based feature naming (`student-redesign`, `student-landing`, `student-portal`) to product-surface ownership with a feature-first folder structure. The goal is to make each route and component tree clearly owned by one feature, retire duplicate and legacy feature folders, and create a migration path that preserves behavior while reducing architectural confusion.

## Current State

The current application mixes three different naming schemes:

- `student-redesign` is the active public student-facing experience for the landing page, browse-teachers page, and public teacher profile.
- `student-portal` owns authenticated student pages, but it also owns public discovery pages such as `/explore` and `/explore/teachers/[id]`.
- `student-landing` still exists as an older public student feature tree, but it is not the active route owner for current app routes.

As a result:

- feature names reflect project history rather than product surfaces
- public and authenticated concerns are mixed
- teacher discovery and course discovery are split across unrelated folders
- route ownership is hard to infer from folder names
- deleting legacy code safely is harder than it should be

## Goals

1. Keep a feature-first folder structure.
2. Replace historical names with product-surface names.
3. Make one feature the clear owner of each page and route family.
4. Retire `student-landing`.
5. Retire `student-redesign` as a name by folding it into clearer feature ownership.
6. Split `student-portal` so it only owns the authenticated student application surfaces it should own.
7. Preserve current user-facing behavior unless a route change is necessary to remove structural confusion.

## Non-Goals

1. Do not redesign page UI in this refactor pass.
2. Do not rewrite backend contracts or API semantics in this pass.
3. Do not extract shared code prematurely into a catch-all utilities area.
4. Do not change URLs unless the current route structure blocks clear feature ownership.

## Design Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Top-level structure | Feature-first | The user explicitly wants feature-first organization, not route-first organization |
| Naming style | Product surfaces (`landing`, `dashboard`, `teachers`, `courses`) | The names should describe what the code owns now, not where it came from historically |
| Public vs authenticated split | Separate public features from authenticated student features | Prevents `student-portal`-style mixing of discovery and account surfaces |
| Shared code policy | `shared` only for code used by 2+ features | Avoids turning `shared` into a dumping ground |
| Route change policy | Allowed only when necessary | Preserves behavior while still fixing structural conflicts |
| Refactor discipline | TDD required for implementation | No production refactor code without a failing test first |

## Target Feature Map

```text
src/features/
  landing/
  auth/
  onboarding/
  dashboard/
  teachers/
  courses/
  teacher-marketing/
  shared/
```

### Ownership Rules

- `landing` owns the public student landing experience.
- `auth` owns login, register, forgot-password, and reset-password flows.
- `onboarding` owns the student onboarding flow only.
- `dashboard` owns authenticated student home and enrolled-course surfaces.
- `teachers` owns public student-facing teacher discovery and public teacher profiles.
- `courses` owns public course discovery and public course detail.
- `teacher-marketing` owns the teacher acquisition/marketing page currently mounted at `/teachers`.
- `shared` owns only code that is genuinely reused across two or more features and has a stable interface.

## Route Ownership Map

| Current route | Target feature owner | Notes |
| --- | --- | --- |
| `/[locale]/(student)` | `landing` | Canonical public student landing page |
| `/[locale]/browse-teachers` | `teachers` | Transitional teacher discovery route |
| `/[locale]/teachers/[id]` | `teachers` | Canonical public teacher profile |
| `/[locale]/explore` | `courses` | Public course discovery page |
| `/[locale]/courses/[courseId]` | `courses` | Public course detail |
| `/[locale]/dashboard` | `dashboard` | Authenticated student dashboard |
| `/[locale]/my-courses` | `dashboard` | Authenticated student course library |
| `/[locale]/explore/teachers/[id]` | `teachers` | Duplicate public teacher-profile path; should be retired in favor of `/teachers/[id]` |
| `/[locale]/login` | `auth` | No route change required |
| `/[locale]/register` | `auth` | No route change required |
| `/[locale]/forgot-password` | `auth` | No route change required |
| `/[locale]/reset-password` | `auth` | No route change required |
| `/[locale]/onboarding` | `onboarding` | No route change required |
| `/[locale]/teachers` | `teacher-marketing` initially, then route-moved | Current route conflicts with the desired public teacher area |

## Necessary Route Corrections

Only two route corrections are justified by the target architecture:

1. The current teacher marketing page should move from `/[locale]/teachers` to `/[locale]/for-teachers`.
   - Reason: `/teachers` should belong to the public student-facing teacher area, not the teacher acquisition page.
   - This is the cleanest way to align folder ownership and URL meaning.

2. The duplicate public teacher discovery/profile paths should be consolidated.
   - `/[locale]/teachers/[id]` remains the canonical public teacher-profile route.
   - `/[locale]/browse-teachers` can remain temporarily during migration, then become a redirect to `/[locale]/teachers`.
   - `/[locale]/explore/teachers/[id]` should be retired and redirected to `/[locale]/teachers/[id]`.

No other route changes are required for this refactor.

## Retirement Plan

### `student-landing`

- Treat `student-landing` as a legacy feature tree.
- Move any still-used or clearly reusable code into `landing` or `shared`.
- Delete the remainder once no app routes or feature imports depend on it.

### `student-redesign`

- Treat `student-redesign` as an active source tree with the wrong name.
- Redistribute its files into `landing`, `teachers`, `courses`, and `shared`.
- Remove the `student-redesign` folder once ownership has been transferred.

### `student-portal`

- Keep only authenticated student surfaces in `dashboard`.
- Move public discovery concerns out to `teachers` and `courses`.
- Delete the old `student-portal` folder once its public and authenticated responsibilities are fully split.

## Migration Phases

### Phase 1: Public feature ownership without behavior changes

- Create `landing`, `teachers`, `courses`, and `teacher-marketing`.
- Move or copy current route owners from `student-redesign` and `student-portal` into their new canonical feature homes.
- Update route imports only; preserve current route behavior.

### Phase 2: Retire legacy public feature trees

- Move any remaining useful code from `student-landing` into `landing` or `shared`.
- Remove dead `student-landing` code.
- Continue migrating `student-redesign` content into its new homes.

### Phase 3: Split authenticated ownership cleanly

- Create `dashboard` as the canonical authenticated student feature.
- Move dashboard and enrolled-course surfaces out of `student-portal`.
- Move public discovery/public teacher-profile surfaces out of `student-portal`.

### Phase 4: Route cleanup

- Introduce `/[locale]/for-teachers`.
- Make `/[locale]/teachers` the canonical public teacher discovery route.
- Redirect transitional public routes to their canonical destinations.

### Phase 5: Shared extraction and dead-code removal

- Extract only stable, multi-feature code to `shared`.
- Remove retired feature trees and transitional wrappers.

## Shared Code Rules

To prevent the new structure from collapsing into a new generic mess:

- `shared` may contain only code used by at least two top-level features.
- `shared` should prefer stable primitives and adapters over page-specific components.
- A component should stay in its owning feature unless duplication is proven.
- Feature-to-feature imports should be minimized; when reuse is real, prefer extracting to `shared`.

## Testing and TDD Requirements

This refactor must be implemented with TDD.

### Mandatory rules

1. No production refactor code without a failing test first.
2. Every route or ownership move that changes behavior expectations must follow red-green-refactor.
3. Existing behavior being preserved still requires tests that prove the preserved behavior.
4. Tests written after the move are not acceptable evidence for correctness.

### Minimum test expectations for implementation

- route-level smoke coverage for each migrated public and authenticated entrypoint
- focused tests for redirects introduced by route consolidation
- tests for any extracted shared interfaces before moving dependent callers
- regression tests for preserved authentication guards on dashboard, my-courses, explore, and course-detail flows

## Risks

### Primary risks

- Ownership moves may accidentally change imports without preserving behavior.
- Public and authenticated route assumptions may be embedded inside moved components.
- Shared extraction may be attempted too early, creating unstable interfaces.
- Route cleanup may break existing links if done before feature ownership is stable.

### Mitigations

- Move ownership before broad cleanup.
- Keep route behavior stable during the first phases.
- Require TDD for every behavior-changing step.
- Delay shared extraction until actual duplication is visible.
- Consolidate canonical teacher routes only after public feature ownership is clear.

## Success Criteria

1. `student-landing`, `student-redesign`, and `student-portal` no longer exist as active feature owners.
2. Each current student-facing route maps clearly to exactly one product-surface feature.
3. Public discovery and authenticated student application concerns are separated.
4. `shared` contains only genuinely reused, stable interfaces.
5. Only necessary route changes are introduced.
6. The teacher marketing page is no longer competing with public teacher discovery for the `/teachers` path.
7. Implementation proceeds under TDD rather than post-hoc verification.
