# Student Surface Redesign (Bold and Youthful) — Design Spec

Date: 2026-09-11 | Branch: `redesign/taste-skill` | Scope B | Vehicle: impeccable (Operate mode)

## 1. Goal

Replace the visual world of the whole student surface while keeping product truth intact:
routes, copy (ar/en), data fetching, payment logic, and tests stay as-is. Only markup order
and styling change where layouts are rethought.

## 2. Scope (approved: B)

In scope: dashboard, my-courses, my-courses/[courseId], explore, payment/redirect,
onboarding, and the shared student portal shell (desktop sidebar + mobile drawer).
Out of scope: auth pages, public landing, teacher surfaces, admin, backend, copy changes.

## 3. Visual foundations (approved)

- Color: Elemni blue `#0284C7` is the single accent, deep `#0369A1` for emphasis.
  Semantic colors (emerald, amber, red, sky) unchanged. Rebuilt neutrals: warm paper
  `#FAF9F6` with near-ink `#14202B` text in light mode; deep navy `#0A1826` surfaces
  with luminous blue accents in dark mode. No gradients, no purple.
- Type: Readex Pro stays (loaded, Arabic-optimized, no new dependency). Headlines at
  Black 900 display scale with tight leading; body stays regular. One family, two extremes.
- Shape language: chunky sticker-like. Cards at 20-24px radii with 2px ink borders and
  hard offset shadows, pill buttons, slightly rotated badges. Controlled neo-brutalist
  edge that stays readable.
- Motion language: springy (staggered entrances, bouncy hovers/taps, animated counters).
  Only `transform` and `opacity` animate. Full collapse to static under reduced-motion
  via the existing `MotionProvider`.

## 4. Per-page concepts (approved)

- Dashboard: oversized greeting hero with sticker profile chip; bento study grid with a
  continue-learning feature tile, giant progress numeral, animated-counter stat tiles,
  bold image cards for current courses.
- My-courses: display-scale library header with oversized count numeral; chunky pill
  filter bar; thick-bordered course cards with big progress numerals.
- Course detail: poster-style hero with huge title and sticker metadata; bold bordered
  purchase panel with giant price numeral; chunky curriculum accordion rows.
- Explore: editorial discovery wall; oversized headline; asymmetric card sizes;
  subject filters as horizontal sticker pills.
- Payment result: bold stamped receipt card; giant status badge; oversized title;
  chunky labeled detail rows; primary CTA as the largest element on screen.
- Onboarding: full-screen stepped moment with giant step numerals, chunky option cards,
  bold segment progress.
- Shell: sidebar with thicker active states, sticker logo tile, chunky logout; mobile
  drawer included.

## 5. Motion, themes, verification (approved)

- Shared spring presets; no scroll-hijacking; counters render final values under
  reduced-motion.
- Every token ships as a light/dark pair; verified in both modes before handoff.
  Logical Tailwind properties throughout for RTL mirroring. No new em-dashes.
- Accessibility floor: WCAG AA text/CTA contrast, visible blue focus rings, preserved
  semantic headings, decorative rotations aria-hidden, 44px minimum hit targets.
- Safety rails: no route/slug/copy/data/payment changes. Existing unit tests keep
  passing; `npm run lint` clean; `npm run build` green. Impeccable detector runs once
  over changed targets at the end, plus a visual check in both themes.

## 6. Self-review

- Placeholders: none. All tokens, pages, and rules are concrete.
- Consistency: single accent, one radius system, one motion language; no conflicts.
- Scope: single surface redesign; auth/landing/backend explicitly excluded.
- Ambiguity: "giant/oversized" is intentionally relative and resolved per page at
  implementation against the display-type scale; nothing else admits two readings.
