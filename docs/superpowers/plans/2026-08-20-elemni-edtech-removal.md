# Elemni-Edtech Prototype Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unused `elemni-edtech/` prototype so the Next.js app under `src/` is the only active frontend codebase without changing runtime behavior.

**Architecture:** This is a narrow repository cleanup rather than a product change. The implementation deletes the dead Vite app, simplifies `tsconfig.json`, and uses repository search plus lint/build verification to prove that the live Next.js app does not depend on the removed tree.

**Tech Stack:** Next.js 16.2.10, TypeScript 5, ESLint 9, npm

**Spec:** `docs/superpowers/specs/2026-08-20-elemni-edtech-removal-design.md`

## Global Constraints

- Remove dead prototype code that is not used by the live application.
- Simplify the repo so there is one active frontend codebase.
- Remove configuration that exists only because the prototype folder is present.
- Preserve current runtime behavior of the Next.js app.
- Do not refactor the live `src/` structure in this phase.
- Do not rewrite historical design or plan documents that mention `elemni-edtech`.
- Do not migrate prototype-only files unless the live app is proven to import them.
- Do not change page behavior, UI, routes, or data flow as part of this cleanup.

---

## File Structure

- `tsconfig.json` — remove the obsolete `elemni-edtech` exclude entry so the TypeScript config reflects only the live Next.js app.
- `elemni-edtech/` — delete the entire legacy Vite prototype tree.
- `docs/superpowers/specs/` and `docs/superpowers/plans/` — keep historical references intact; they are valid search results but not runtime dependencies.

### Task 1: Remove the prototype tree and validate the live app

**Files:**
- Delete: `elemni-edtech/`
- Modify: `tsconfig.json`
- Test: repository root search commands, `npx eslint .`, `npm run build`

**Interfaces:**
- Consumes: repository root directory `elemni-edtech/`; `tsconfig.json` `exclude` array `["node_modules", "elemni-edtech"]`
- Produces: repository root no longer contains `elemni-edtech/`; `tsconfig.json` `exclude` array `["node_modules"]`; runtime and config code paths contain no `elemni-edtech` references

- [ ] **Step 1: Capture the baseline repo state**

```bash
test -d elemni-edtech
rg -n '"exclude": \["node_modules", "elemni-edtech"\]' tsconfig.json
! rg -n "elemni-edtech" src package.json package-lock.json next.config.* 2>/dev/null
```

Run: the three commands above from the repository root
Expected: the directory check exits `0`, the `tsconfig.json` search finds the existing exclude line, and the negated runtime/config search exits `0`

- [ ] **Step 2: Update `tsconfig.json` to remove the obsolete exclude**

```diff
 {
-  "exclude": ["node_modules", "elemni-edtech"]
+  "exclude": ["node_modules"]
 }
```

- [ ] **Step 3: Delete the legacy Vite prototype directory**

```bash
rm -rf elemni-edtech
```

- [ ] **Step 4: Verify the structural cleanup**

```bash
test ! -d elemni-edtech
rg -n '"exclude": \["node_modules"\]' tsconfig.json
! rg -n "elemni-edtech" tsconfig.json src package.json package-lock.json next.config.* 2>/dev/null
```

Run: the three commands above from the repository root
Expected: the deleted-directory check exits `0`, the updated `exclude` line is found, and the negated targeted search exits `0`

- [ ] **Step 5: Verify only historical docs still mention `elemni-edtech`**

```bash
rg -n "elemni-edtech" .
```

Run: the command above from the repository root
Expected: matches appear only under `docs/superpowers/`; any match under `src/`, root config, or runtime code is a blocker and must be removed before continuing

- [ ] **Step 6: Run lint to confirm the live app still passes static checks**

```bash
npx eslint .
```

Run: the command above from the repository root
Expected: exit code `0`

- [ ] **Step 7: Run the production build**

```bash
npm run build
```

Run: the command above from the repository root
Expected: exit code `0`

- [ ] **Step 8: Commit the cleanup**

```bash
git add tsconfig.json
git add -u elemni-edtech
git commit -m "chore: remove elemni-edtech prototype"
```
