# Task 1 Report: App Router Test Infrastructure

## Completed

- Installed Vitest, React Testing Library, jsdom, Jest DOM, Vite React/path support, and Playwright Test as development dependencies.
- Added unit, watch, E2E, and aggregate `test` npm scripts.
- Added `vitest.config.mts` with jsdom, React, TypeScript path support, setup loading, and the Next 16/next-intl navigation compatibility alias.
- Added `src/test/setup.ts` with Testing Library matchers and a localStorage fallback for the Node 26/jsdom runner.
- Added `playwright.config.ts` with production build/start web server configuration.
- Added a focused `AuthPageShell` unit test using its current `{children, locale}` contract and an intl provider.
- Added the public/guarded route Playwright smoke test.

## TDD Evidence

1. The unit test was written first and `npm run test:unit -- src/features/student-auth/components/auth-page-shell.test.tsx` initially failed because the `test:unit` script/harness did not exist.
2. After the harness was added, the focused unit test passed.
3. The E2E smoke test initially reached Playwright but failed because the Chromium executable was not installed; Chromium/headless shell were installed locally, after which the smoke test passed.

## Verification

- `npm test`: passed (1 Vitest file / 1 test; 1 Playwright test).
- `npm run build`: passed on Next.js 16.2.10.

## Concern

The brief's sample URL assertions expected `/ar` and `/ar/browse-teachers` (and `/ar/login`), but this repository configures `next-intl` with `localePrefix: "as-needed"`. Arabic is the default locale, so the running app redirects these to `/`, `/browse-teachers`, and `/login`. The smoke test asserts the actual current baseline behavior.

`npm install` reports 15 existing audit vulnerabilities (2 low, 1 moderate, 12 high); dependency remediation was not part of this task.

## Round 1 Warning Fix

- Removed the deprecated `vite-tsconfig-paths` plugin and enabled native Vite `resolve.tsconfigPaths` support.
- Replaced the warning-producing `globalThis.localStorage?.getItem` probe with an unconditional jsdom localStorage shim in test setup.

Verification after the fix:

- `npm test`: passed (1 Vitest file / 1 test; 1 Playwright test). The two reported Vitest setup warnings are gone. Playwright still emits the environment-level `NO_COLOR`/`FORCE_COLOR` warning.
- `npm run build`: passed on Next.js 16.2.10.

## Round 2 Warning Fix

- Updated the `test:e2e` script to clear inherited `NO_COLOR` and `FORCE_COLOR` variables before launching Playwright.
- `npm test`: passed (1 Vitest file / 1 test; 1 Playwright test) with warning-free test output in this runner.
