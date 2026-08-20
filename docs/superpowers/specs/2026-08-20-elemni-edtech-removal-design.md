# Elemni-Edtech Prototype Removal

**Date:** 2026-08-20
**Status:** Design proposed for review

## Overview

Remove the legacy `elemni-edtech/` Vite prototype from the repository now that the live Next.js application no longer imports from it. The goal of this phase is to make `src/` the only active frontend source tree and remove configuration that exists only to tolerate the prototype folder.

## Current State

- `elemni-edtech/` is a standalone Vite app with its own `package.json`, `tsconfig.json`, `vite.config.ts`, and `src/` tree.
- The live application is the Next.js app rooted in this repository and implemented under `src/`.
- `tsconfig.json` currently excludes `elemni-edtech`.
- Repository search shows no runtime imports from `elemni-edtech` into the live Next.js app.
- Historical design and plan documents reference `elemni-edtech` as the source used during earlier migration work.

## Goals

1. Remove dead prototype code that is not used by the live application.
2. Simplify the repo so there is one active frontend codebase.
3. Remove configuration that exists only because the prototype folder is present.
4. Preserve current runtime behavior of the Next.js app.

## Non-Goals

1. Do not refactor the live `src/` structure in this phase.
2. Do not rewrite historical design or plan documents that mention `elemni-edtech`.
3. Do not migrate prototype-only files unless the live app is proven to import them.
4. Do not change page behavior, UI, routes, or data flow as part of this cleanup.

## Scope

### In Scope

- Delete the `elemni-edtech/` directory.
- Remove direct configuration references that exist only for that directory.
- Verify that repository searches, linting, and build still pass without it.

### Out of Scope

- Cleanup of other root-level folders.
- Consolidation of docs, assets, or designs outside this directory.
- Follow-up architectural refactors inside `src/`.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Removal strategy | Hard delete `elemni-edtech/` | The live app does not import from it, so keeping it only adds noise |
| Historical docs | Leave unchanged | They describe past migration work and are not runtime dependencies |
| Config cleanup | Remove only direct references | Keeps this phase narrow and low risk |
| Validation | Search + lint + production build | Confirms both dependency removal and app integrity |

## Implementation Plan

1. Delete the entire `elemni-edtech/` directory.
2. Update `tsconfig.json` to remove `elemni-edtech` from `exclude`.
3. Search the repository again for `elemni-edtech` references.
4. Confirm any remaining references are historical documentation only.
5. Run lint.
6. Run a production build.

## Files Expected To Change

- `tsconfig.json`
- `elemni-edtech/` (deleted)

## Risk Assessment

### Primary Risk

There may be an overlooked dependency on prototype assets, mock data, or component names that is not expressed as a direct import path.

### Mitigation

- Search for both `elemni-edtech` path references and migrated component names.
- Run lint and a full production build after deletion.
- Treat any remaining references in runtime code as a blocker and restore scope to migration instead of deletion.

## Verification

- `rg -n "elemni-edtech" .`
- `npx eslint .`
- `npm run build`

## Success Criteria

1. The `elemni-edtech/` directory no longer exists in the repository.
2. `tsconfig.json` no longer excludes `elemni-edtech`.
3. The live Next.js app has no runtime references to `elemni-edtech`.
4. Remaining references, if any, are documentation-only.
5. Lint and production build succeed after the removal.

