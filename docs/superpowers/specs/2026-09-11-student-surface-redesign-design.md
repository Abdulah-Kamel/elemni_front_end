# Student Surface Redesign (Bold and Youthful, Motion-Forward) — Design Spec

Date: 2026-09-11 | Branch: `redesign/taste-skill` | Scope B | Vehicle: impeccable (Operate mode)

Note: direction B was built and rejected on feel as too static; direction A was built
and also rejected. User chose to return to B with motion turned up. This spec now
describes B+ : the sticker-notebook world with rich orchestrated motion.

## 1. Goal

Replace the visual world of the whole student surface while keeping product truth intact:
routes, copy (ar/en), data fetching, payment logic, and tests stay as-is. Only markup order
and styling change where layouts are rethought.

## 2. Scope (approved: B)

In scope: dashboard, my-courses, my-courses/[courseId], explore, payment/redirect,
onboarding, and the shared student portal shell (desktop sidebar + mobile drawer).
Out of scope: auth pages, public landing, teacher surfaces, admin, backend, copy changes.

## 3. Visual foundations (approved: direction B+, motion-forward)

- Color: Elemni blue `#0284C7` is the single accent, deep `#0369A1` for emphasis.
  Semantic colors (emerald, amber, red, sky) unchanged. Warm paper `#FAF9F6` ground,
  near-ink `#14202B` text in light mode; deep navy `#0A1826` with luminous blue in
  dark mode. No gradients, no purple. Theme tokens reused where visually equivalent.
- Type: Readex Pro stays (loaded, Arabic-optimized, no new dependency). Headlines at
  Black 900 display scale with tight leading; body stays regular.
- Shape language: chunky sticker-like. 20-24px card radii with 2px ink borders and
  hard offset shadows, pill buttons, slightly rotated sticker badges.
- Motion language (turned up): springy and orchestrated. Staggered entrances,
  sliding active-nav indicator, animated counters and progress, magnetic-feeling
  hovers with press physics, scroll-triggered section reveals. Only `transform` and
  `opacity` animate. Full collapse to static under reduced-motion via the existing
  `MotionProvider` and per-component reduced-motion guards.

## 4. Per-page concepts (approved: direction A)

- Dashboard: display-scale greeting hero with sticker profile chip; bento grid with a
  continue-learning feature tile (animated progress, spring entrance), blue next-step
  tile; stat strip with rolling counters; bold course cards with hover lift and press
  physics; below-fold sections reveal on scroll.
- My-courses: display-scale library header with rolling count; sticker pill filters;
  thick-bordered course cards with animated progress.
- Course detail: poster-style hero with spring entrance; bold purchase panel with
  rolling price numeral; chunky curriculum accordion with animated expands.
- Explore: editorial discovery wall with staggered card entrances; asymmetric sizes;
  sticker filter pills with sliding active indicator.
- Payment result: stamped receipt card with springy status badge entrance; bold
  title; chunky detail rows; oversized primary CTA with press physics.
- Onboarding: stepped flow with animated step transitions, chunky option cards,
  animated segment progress.
- Shell: sticker logo tile, nav with sliding active indicator, chunky logout, all
  entrances staggered. Auth pages out of scope (scope B).

## 5. Motion, themes, verification (approved: motion-forward)

- Motion turned up: spring entrances with stagger, sliding active indicators
  (layoutId), rolling counters, animated progress, hover lift with press physics,
  scroll-triggered reveals below the fold. No scroll-hijacking, no infinite loops;
  counters render final values under reduced-motion; everything collapses to static
  under reduced-motion.
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
