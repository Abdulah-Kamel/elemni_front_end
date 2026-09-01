# Course Detail, Learning View, and Checkout Design

## Goal

Give students a clearer, more trustworthy course journey inspired by marketplace patterns such as Udemy while preserving Elemni's brand, routes, backend authority, and Arabic-first RTL experience.

## Design read and dials

Reading this as an Arabic-first education marketplace redesign for students, with a marketplace-clear and classroom-focused language, leaning toward the existing Elemni sky-blue Tailwind/Motion system.

- `DESIGN_VARIANCE`: 6. A deliberate two-column course composition, but predictable on mobile.
- `MOTION_INTENSITY`: 4. Motion communicates state changes and focus; reduced motion removes transforms.
- `VISUAL_DENSITY`: 6. Course discovery needs scannable metadata; learning needs compact navigation without becoming a cockpit.

## Product decisions

1. `/courses/[courseId]` remains the canonical course URL and becomes public. Authentication is optional for the route. A guest can inspect published course details and preview the curriculum; an enrolled student gets protected media and learning controls.
2. The first implementation keeps discovery and learning as two states of the same route. A separate `/learn/[courseId]` route is deferred until real usage data justifies the migration.
3. Checkout remains PayTabs-owned. The frontend adds a local confirmation dialog/sheet only to confirm the backend-sourced price, course context, and 30-day access before calling the existing BFF endpoint.
4. Backend remains the source of truth for price, enrollment, payment status, expiry, protected URLs, and authorization. The frontend never calculates totals or unlocks content locally.

## Experience architecture

### Public course state

- Course hero uses a split composition: cover image and discovery metadata are prominent, while the purchase panel remains visible on desktop and stacks first on mobile.
- The hero exposes subject, grade, stream, teacher, lesson count, duration, and exam count with strong hierarchy.
- Curriculum is visible as a preview. Protected items are clearly marked as requiring enrollment.
- The purchase panel shows the backend price, access duration, teacher context, and one primary action.

### Enrolled course state

- The same route swaps the purchase panel for a continue-learning panel with expiry and resume action.
- The active Bunny player is promoted above the curriculum on desktop and remains usable on narrow screens without blocking the list.
- Curriculum keeps the current chapter/lesson accordion behavior and protected video/document links.
- The UI does not imply progress that is absent from the API contract.

### Checkout confirmation

- A responsive dialog on desktop becomes a bottom sheet on small screens using existing project primitives where possible.
- It contains course title, cover, teacher, formatted backend price, 30-day access copy, cancel, and continue-to-payment actions.
- Continue invokes `POST /api/student/payments/checkout` with `{ course_id }`, then navigates to the returned `redirect_url`.
- 401 redirects to login, 409 refetches enrollment state, and other errors stay contextual in the confirmation surface.

## Data and route boundaries

- `src/app/[locale]/courses/[courseId]/page.tsx` stays thin: validate the id, set locale, load public filter labels, determine optional authentication, and render the feature component.
- `src/app/api/student/my-courses/[courseId]/route.ts` must support a guest request without calling the authenticated `/api/v1/my/courses` endpoint. For guests, it resolves the public course through the supplied teacher slug. For enrolled requests, it continues to use protected data; a future backend `teacher_slug` enrollment field can remove the current owner-discovery fan-out.
- `src/app/api/student/payments/checkout/route.ts` remains the only browser-to-BFF checkout boundary.
- No access token is placed in client state or browser storage.

## Component boundaries

Components live under `src/features/courses/components/`:

- `course-hero.tsx`: title, cover, teacher, badges, description, and stats.
- `course-purchase-panel.tsx`: enrolled/guest action state and confirmation trigger.
- `checkout-confirmation.tsx`: dialog/sheet contents and checkout request lifecycle.
- `curriculum-accordion.tsx`: chapter, lesson, and item preview/learning navigation.
- `learner-player.tsx`: Bunny iframe and active lesson metadata.
- `course-detail.tsx`: client orchestration only; query state, enrollment mode, active media, and composition.

Formatting utilities remain feature-local until a third consumer proves promotion is useful. New visible copy is added to `src/messages/ar.json` and `src/messages/en.json`.

## Visual system

- Keep the existing sky-blue accent (`#0284C7` / `#0369A1`), light sky surfaces, slate ink, and white cards. Do not copy Udemy branding or purple.
- Use one radius family: soft 12-16px cards and compact controls, with pills reserved for metadata/status.
- Use logical RTL utilities and test both locales.
- Avoid paragraph-level `max-w-3xl`; readable measure comes from the surrounding grid.
- Use existing `motion/react` only for motivated entrance and state transitions. Honor `useReducedMotion`.
- Use skeletons for loading, contextual error states, and a composed empty curriculum state.

## Acceptance criteria

- Guests can open a published course detail URL without a login redirect when a public teacher slug is available.
- Enrolled users still receive protected media and can resume a lesson from the same canonical route.
- Course purchase shows a confirmation surface, then uses the existing PayTabs redirect without frontend price calculations.
- Desktop, tablet, and mobile layouts do not overflow; the purchase/player panel has an explicit mobile order.
- Arabic and English copy, direction, dates, numbers, focus states, and keyboard interactions are covered.
- Existing course-detail behavior tests remain green, with new tests covering guest rendering, checkout confirmation, and enrolled/player state.
