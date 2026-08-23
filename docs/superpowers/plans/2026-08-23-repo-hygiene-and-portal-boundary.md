# Repo Hygiene and Portal Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `docs/` the tracked documentation home, remove local-only tooling/design noise from remote tracking, and move the student portal shell out of `shared` into a dedicated `portal` feature without changing behavior.

**Architecture:** This work has two slices. First, normalize repository policy: `docs/` becomes tracked, `specs/` is folded into `docs/`, and local-only tool/cache/design output is ignored and removed from remote tracking. Second, narrow the UI ownership boundary by moving the authenticated student shell from `shared` to a dedicated `portal` feature and repointing consumers with preserved-behavior tests.

**Tech Stack:** Next.js 16.2.10 App Router, React 19, TypeScript 5, next-intl 4, Vitest, Playwright

**Spec:** Approved in chat on 2026-08-23

## Global Constraints

- Keep `docs/` available both locally and in the remote repository.
- Remove the top-level `specs/` root; use `docs/` as the canonical documentation home.
- Keep local-only tooling, generated output, and raw design assets out of remote tracking.
- Preserve current runtime behavior while changing ownership paths.
- Do not mix unrelated UI cleanup into the portal-shell move.
- Run verification sequentially: `npm run test` first, then `npm run build`.
- No production refactor code without a failing preserved-behavior test first.

---

## File Structure

- `.gitignore` — tracked policy for repo-local-only folders and tracked docs
- `docs/specs/001-student-landing-page/*` — migrated documentation from the old `specs/` root
- `src/features/portal/components/portal-shell.tsx` — canonical home for the authenticated student portal shell
- `src/features/portal/components/portal-shell.test.tsx` — preserved-behavior characterization for the portal shell
- `src/features/portal/styles/portal-shell.css` — portal-shell layout styles
- `src/features/dashboard/components/*` and `src/features/courses/components/*` — consumers repointed to `features/portal`

### Task 1: Normalize repository documentation and local-only folder policy

**Files:**
- Modify: `.gitignore`
- Move: `specs/001-student-landing-page/**` → `docs/specs/001-student-landing-page/**`
- Remove from remote tracking only: `.specify/**`
- Keep local-only (ignored): `design/**`, `test-results/**`, `.superpowers/**`, `.claude/**`, `.codex/**`, `.agents/**`

**Interfaces:**
- Consumes: existing tracked `specs/001-student-landing-page/**` files and current `.gitignore`
- Produces: tracked `docs/` policy and no remote-tracked `.specify` files

- [ ] **Step 1: Update `.gitignore` to track `docs/` and ignore local-only folders**

```gitignore
# local AI / agent / generated workspace state
.superpowers/
.claude/
.codex/
.agents/
.specify/
design/
test-results/

# docs are tracked; specs root is retired in favor of docs/
/specs/
```

- [ ] **Step 2: Move tracked spec documents into `docs/specs/`**

```bash
mkdir -p docs/specs
git mv specs/001-student-landing-page docs/specs/001-student-landing-page
```

- [ ] **Step 3: Remove `.specify/` from remote tracking while keeping local files**

```bash
git rm -r --cached .specify
```

- [ ] **Step 4: Verify the repo policy changes**

Run: `git status --short`
Expected:
- `docs/specs/001-student-landing-page/**` tracked as moves/additions
- `.specify/**` shown as removals from the index only
- `design/` and `test-results/` ignored

### Task 2: Move the authenticated student shell from `shared` to `portal`

**Files:**
- Create: `src/features/portal/components/portal-shell.tsx`
- Create: `src/features/portal/components/portal-shell.test.tsx`
- Create: `src/features/portal/styles/portal-shell.css`
- Modify: `src/features/dashboard/components/student-dashboard.tsx`
- Modify: `src/features/dashboard/components/my-courses.tsx`
- Modify: `src/features/courses/components/explore-courses.tsx`
- Modify: `src/features/courses/components/course-detail.tsx`
- Delete: `src/features/shared/components/student-app-shell.tsx`
- Delete: `src/features/shared/components/student-app-shell.test.tsx`
- Delete: `src/features/shared/styles/student-app-shell.css`

**Interfaces:**
- Consumes:
  - default export `StudentPortalShell({ children, user, active }: { children: ReactNode; user: UserDto | null; active?: string })`
  - existing portal-nav behavior already characterized by `student-app-shell.test.tsx` and authenticated E2E smoke tests
- Produces:
  - default export `StudentPortalShell` from `src/features/portal/components/portal-shell.tsx`
  - all student portal consumers importing from `@/src/features/portal/components/portal-shell`

- [ ] **Step 1: Repoint one consumer and the unit test to the future `portal` path before the files exist**

```ts
// src/features/dashboard/components/student-dashboard.tsx
import StudentPortalShell from "@/src/features/portal/components/portal-shell";

// src/features/shared/components/student-app-shell.test.tsx
import StudentPortalShell from "@/src/features/portal/components/portal-shell";
```

- [ ] **Step 2: Run the focused unit test to verify the refactor is red**

Run: `npm run test:unit -- src/features/shared/components/student-app-shell.test.tsx`
Expected: FAIL with module resolution error for `@/src/features/portal/components/portal-shell`

- [ ] **Step 3: Move the shell files into the new `portal` feature and update imports**

```bash
mkdir -p src/features/portal/components src/features/portal/styles
git mv src/features/shared/components/student-app-shell.tsx src/features/portal/components/portal-shell.tsx
git mv src/features/shared/components/student-app-shell.test.tsx src/features/portal/components/portal-shell.test.tsx
git mv src/features/shared/styles/student-app-shell.css src/features/portal/styles/portal-shell.css
```

```ts
// src/features/portal/components/portal-shell.tsx
import "../styles/portal-shell.css";
```

```ts
// each consumer
import StudentPortalShell from "@/src/features/portal/components/portal-shell";
```

- [ ] **Step 4: Run focused verification to green**

Run: `npm run test:unit -- src/features/portal/components/portal-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: Run full verification sequentially**

Run: `PLAYWRIGHT_PORT=3101 npm run test`
Expected: PASS

Run: `npm run build`
Expected: PASS

