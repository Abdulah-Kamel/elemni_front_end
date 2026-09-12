# DESIGN.md — Elemni Student Surface (Sticker Notebook, B+)

**Creative North Star: "A sticker-covered study notebook that moves."**

## Overview

The student surface (dashboard, my-courses, course detail, explore, payment result,
onboarding, portal shell) speaks one visual world: bold, youthful, motion-forward.
Borders carry weight, shadows sit hard, numerals run big, and every transition rides
a spring. The world never obscures the task: routes, copy, data, and payment logic
are untouched product truth owned by PRODUCT.md.

**Key Characteristics:**
- Ink-bordered tiles with hard offset shadows on warm paper.
- Elemni blue as the single accent; status colors keep semantic meaning.
- Readex Pro Black display type against regular body, one family.
- Springs everywhere: entrances stagger, indicators slide, counters roll.
- Dark mode is a deep-navy twin, not an afterthought.

## Colors

- **Elemni Blue (accent):** `#0284C7` primary actions, active states, progress. Deep `#0369A1` for emphasis text. Luminous `#38BDF8` on dark grounds.
- **Paper / Ink (light):** paper `#FAF9F6`, card white, ink `#14202B`, muted slate.
- **Navy (dark):** ground `#0A1826`, borders `#38BDF8`, ink shadow `#020617`.
- **Status:** emerald (success/active), amber (pending/test), red (failed/error), sky (info/refund). Never repurposed.
- **The Single-Accent Rule.** One blue does all the talking. A second saturated accent anywhere is a regression.

## Typography

- Readex Pro, Arabic-optimized, already loaded. Display at Black 900 with tight
  tracking (`-0.02em` max); body regular with comfortable Arabic line-height.
- **Numerals Rule.** Big numbers are measurement (progress, counts, prices) and always
  tabular. Monospace only for transaction values, never as decoration.

## Shape and Depth

- Cards: 20-24px radii, 2px ink borders, `5px 5px 0` hard offset shadow.
- Buttons: pills with 2px borders, `3px 3px 0` shadow, press physics (translate on active).
- Badges: pills, 2px borders, slight static rotation for stickers.
- **The Neobrutalist License.** This world chose the hard offset shadow deliberately;
  soft blurred cards inside it are the regression, not the reverse.

## Motion

- Spring presets (`stiffness 260, damping 22`; shell `320/28`). Staggered entrances,
  `layoutId` sliding indicators (nav, tabs), rolling counters, animated progress,
  hover lift with tap press, scroll-triggered reveals below the fold.
- Only `transform` and `opacity` animate. No scroll-hijacking, no infinite loops.
- **The Reduced-Motion Rule.** Everything collapses to instant under reduced-motion;
  counters always hold their final value in the DOM.

## Components

- `sticker-tile`, `sticker-btn`, `sticker-btn-outline`, `sticker-badge`,
  `sticker-numeral` (`src/features/portal/styles/sticker.css`).
- `StudyCounter` (animated numeral, reduced-motion safe).
- Shared frame: ruled-paper shell background, blue selection and focus rings.

## Rules

- **No Kickers Rule.** No eyebrow label above a heading; the heading carries its weight.
- **No Gradients Rule.** Depth comes from borders and offset shadows, never gradients.
- **RTL Rule.** Logical properties throughout; transforms avoid the x-axis except
  drawer motion that mirrors correctly.
- **Dark-Twin Rule.** Every token ships as a light/dark pair, verified in both modes.

## Do's and Don'ts

- Do keep semantic colors on their meaning; don't invent new status hues.
- Do animate state changes; don't animate decoration for its own sake.
- Do preserve roles, labels, and copy; redesign never renames the product's language.
- Don't add routes, slugs, or copy in a visual pass.
- Don't hand-roll icons; Lucide only, one family.
