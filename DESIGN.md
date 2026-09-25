# DESIGN.md — Elemni Student Frontend

**Creative north star: “A sticker-covered study notebook that moves.”**

## Scope

This guide covers the student-facing frontend: the student portal, dashboard,
course discovery and learning, teacher profiles, authentication, onboarding, and
marketing pages. Keep the product language, routes, data, and learning flows
intact while applying this visual system.

The shared student portal uses a playful notebook material language: warm, clear
surfaces, confident blue, inked outlines, and deliberate hard shadows. Marketing
and legacy pages can use softer surfaces and gradients where those patterns are
already established; keep them within the same Elemni palette and typography.

## Brand and color

Sky blue is the primary brand color. Use the shared theme tokens in
`src/app/globals.css` instead of introducing one-off colors.

| Role | Token / value | Use |
| --- | --- | --- |
| Primary | `brand-600` / `#0284C7` | Main actions, selected states, progress, focus |
| Primary hover | `brand-700` / `#0369A1` | Hover and stronger emphasis |
| Pale brand | `brand-50` / `#F0F9FF`; `brand-100` / `#E0F2FE` | Tinted surfaces and subtle selection |
| Bright brand | `brand-300` / `#7DD3FC`; `brand-400` / `#38BDF8` | Dark-mode accents and highlights |
| Ink | `ink` / `#0F172A` | Main text and sticker outlines |
| Page | `page` / `#F8FAFC` | Light page background |
| Surface | `surface` / `#FFFFFF` | Cards and controls |
| Muted surface | `surface-muted` / `#F1F5F9` | Quiet sections and secondary controls |
| Muted text | `muted` / `#64748B` | Supporting copy and metadata |
| Orange accent | `accent` / `#F97316` | Occasional highlights; never a second primary action color |

Success (`#22C55E`), warning (`#F59E0B`), and error (`#EF4444`) are semantic
only. Do not use status colors as decoration or to encode unrelated meaning.
Gradients are allowed in established marketing treatments; shared portal
components should rely on solid brand colors, borders, and shadows.

### Dark mode

Dark mode is a supported theme, not a page-specific experiment. The shared dark
palette uses page `#0B132B`, surface `#0F172A`, muted surface `#162033`, ink
`#F8FAFC`, muted text `#94A3B8`, and border `#1E293B`. Use pale/bright sky blue
for accents and `#020617` for hard sticker shadows. Every new shared component
must remain legible in both themes.

## Typography

- Use **Readex Pro** throughout, loaded for Arabic and Latin in
  `src/app/layout.tsx`. Apply the existing `font-readex` utility where needed;
  do not add a second display or body family.
- Use weights 400–500 for body copy, 600–700 for emphasis and controls. Reserve
  the heaviest available utility weights for short headings and sticker-style
  labels rather than long passages.
- Arabic is the primary language. Keep comfortable line-height for Arabic text,
  and use logical spacing/alignment so the same hierarchy works in RTL and LTR.
- Use tabular numerals for prices, counts, durations, and progress values.
  Monospace is reserved for literal codes or transaction identifiers.

## Layout and spacing

- Use a responsive single-column flow on small screens and expand into grids as
  content allows. Keep reading and lesson content at a comfortable line length.
- Use the existing Tailwind spacing scale consistently. Group related controls
  closely and provide clear separation between sections.
- Use logical CSS properties (`start`/`end`, `ps`/`pe`, `ms`/`me`) for layouts
  that must work in both writing directions.
- Do not let decorative notebook treatments reduce contrast or compete with
  course titles, lesson content, and primary actions.

## Shape and depth

The portal's sticker components are the reference for the notebook material:

- Tiles use a 2px ink border, about 20px corner radius, and a `5px 5px 0`
  hard offset shadow (`.sticker-tile`).
- Primary and outline buttons use pill corners, 2px borders, and a `3px 3px 0`
  hard shadow. Pressing moves the button into its shadow.
- Badges are compact outlined pills. Rotation is optional and static; keep it
  subtle and do not rotate text that needs to be scanned quickly.
- Inputs and dense utility surfaces can use quieter borders and smaller radii
  when that improves usability. Do not force every page into a sticker card.
- In dark mode, use sky borders and a deep ink shadow so the same forms remain
  distinct against navy surfaces.

## Motion and interaction

- Use motion to clarify a state change: pressed buttons, selected tabs, expanded
  sections, progress, and entrances. Keep spring motion short and purposeful.
- Animate transforms and opacity where possible. Avoid scroll hijacking,
  persistent decorative motion, and motion that delays access to content.
- Respect `prefers-reduced-motion`; the shared sticker styles already reduce
  animation and transition durations in the portal shell.
- Keep final values present in the DOM when animating counters or progress.
- Provide visible keyboard focus. The portal shell uses a 3px brand focus
  outline; preserve at least equivalent focus visibility in other contexts.

## Shared patterns

Use the existing shared styles and utilities before creating new variants:

- `.sticker-tile`, `.sticker-btn`, `.sticker-btn-outline`, `.sticker-badge`, and
  `.sticker-numeral` in `src/features/portal/styles/sticker.css`.
- Brand, surface, ink, page, semantic color, and radius tokens in
  `src/app/globals.css`.
- Readex Pro via `font-readex` / `--font-readex-pro`.
- Lucide icons, used consistently and with accessible labels for icon-only
  controls.

## Product and accessibility rules

- Keep existing routes, copy, roles, data, and payment/learning behavior intact
  during visual work.
- Use semantic colors only for their meaning and maintain readable contrast on
  both light and dark surfaces.
- Preserve RTL and LTR behavior, keyboard access, visible focus, and reduced
  motion support.
- Avoid eyebrow/kicker labels above headings unless the content hierarchy
  genuinely needs one.
- Avoid adding decorative elements that obscure the learning task. Use the
  notebook language to support clarity, not to make every surface noisy.
