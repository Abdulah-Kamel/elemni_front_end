# Enrolled Course Player-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder only enrolled course-detail pages so the active video/PDF viewer appears first, followed by course details and curriculum navigation.

**Architecture:** Keep the existing data flow, selection logic, player, progress mutation, and public layout unchanged. Refactor the enrolled branch in `CourseDetail` into a player-first full-width section followed by a two-column details/curriculum area on desktop and a single vertical flow on mobile.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-22-enrolled-course-player-first-design.md`

## Global Constraints

- Apply the layout change to enrolled mode only; public course pages remain unchanged.
- Preserve automatic resume/first-playable selection, progress mutations, curriculum state, PDF actions, and video behavior.
- Keep `LearnerPlayer` iframe behavior, PDF viewport height, and video 16:9 presentation unchanged.
- Maintain DOM order matching visual order for keyboard and screen-reader users.
- Do not change API contracts, data loading, checkout, or progress logic.
- Verify both Arabic RTL and English LTR at mobile and desktop widths.

---

### Task 1: Add enrolled layout-order regression coverage

**Files:**
- Modify: `src/features/courses/components/course-detail.container.test.tsx:154-213`
- Modify: `src/features/courses/components/course-detail.container.test.tsx:313-359`

**Interfaces:**
- Consumes: Existing `detail`, `publicDetail`, `CourseDetail`, and mocked learner components.
- Produces: Assertions that enrolled mode places `course-player` before the course title/details and curriculum, while public mode retains its existing purchase-first composition.

- [ ] **Step 1: Add a failing enrolled order assertion**

After the existing enrolled player assertion, capture the relevant elements and assert DOM order:

```ts
const player = document.querySelector("#course-player");
const title = screen.getByRole("heading", { name: "كورس التفاضل" });
const curriculum = screen.getByTestId("learner-curriculum-sidebar");

expect(player).not.toBeNull();

expect(player.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
expect(title.compareDocumentPosition(curriculum) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
```

The assertions must verify the player precedes details and details precedes curriculum in the enrolled DOM.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npm test -- src/features/courses/components/course-detail.container.test.tsx
```

Expected: the new enrolled order assertion fails because `CourseHero` currently renders before `LearnerPlayer`.

- [ ] **Step 3: Add a public-mode guard assertion**

In the existing public-mode test, assert the enrolled curriculum sidebar and player are absent or not rendered, preserving the current public purchase surface:

```ts
expect(screen.queryByTestId("learner-curriculum-sidebar")).not.toBeInTheDocument();
expect(document.querySelector("#course-player")).toBeNull();
expect(screen.getByRole("button", { name: "اشترك في الكورس" })).toBeInTheDocument();
```

- [ ] **Step 4: Run the focused test again**

Run:

```bash
npm test -- src/features/courses/components/course-detail.container.test.tsx
```

Expected: the new order assertion remains red until the enrolled layout is changed; the public guard passes.

### Task 2: Implement the enrolled player-first composition

**Files:**
- Modify: `src/features/courses/components/course-detail.tsx:293-395`

**Interfaces:**
- Consumes: Existing `visibleActiveContent`, `CourseHero`, `LearnerPlayer`, `LearnerCurriculumSidebar`, and current enrolled handlers.
- Produces: Enrolled-only DOM structure with the player first, then details and curriculum; public branch remains behaviorally identical.

- [ ] **Step 1: Split enrolled and public composition without changing state logic**

Keep the existing outer page shell, loading/error states, back link, and public branch. In the successful content branch, make the enrolled branch render these exact sibling sections in this order:

- An `AnimatePresence` block containing the existing `m.div` keyed as `course-player`, with `LearnerPlayer activeContent={visibleActiveContent}` and the existing enter/exit animation props.
- A lower `div` with `className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]"`.
- The lower grid’s first child is a `min-w-0 space-y-8` wrapper containing the existing `CourseHero` props.
- The lower grid’s second child is the existing `LearnerCurriculumSidebar` with all current chapter, lesson, active-item, toggle, play/open, and completed-item props.

Keep the existing public composition in the `!enrolled` branch, including `CourseHero`, public curriculum accordion, and purchase panel. Do not duplicate or move the state calculations above the render.

Use the existing animation props for the player and hero. Do not duplicate selection, mutation, or curriculum callback logic. The player section must remain in the DOM before `CourseHero` and the curriculum sidebar.

- [ ] **Step 2: Preserve desktop and mobile layout classes**

Use a full-width player wrapper before the lower grid. The lower grid must collapse naturally to one column below the existing `lg` breakpoint. Do not introduce physical `left`/`right` spacing utilities; retain logical spacing and existing RTL-safe classes.

- [ ] **Step 3: Run the focused course-detail tests**

Run:

```bash
npm test -- src/features/courses/components/course-detail.container.test.tsx
```

Expected: all course-detail tests pass, including enrolled player/PDF behavior and public purchase behavior.

### Task 3: Verify responsive and quality gates

**Files:**
- Modify: none unless test failures require a focused correction.
- Test: `src/features/courses/components/course-detail.container.test.tsx`

**Interfaces:**
- Consumes: Completed enrolled composition.
- Produces: Verified responsive-safe layout with no behavioral regressions.

- [ ] **Step 1: Run the feature test set**

Run:

```bash
npm test -- src/features/courses/components/course-detail.container.test.tsx src/features/courses/components/course-detail-skeleton.test.tsx
```

Expected: all selected tests pass.

- [ ] **Step 2: Run lint and typecheck**

Run:

```bash
npm run lint
npm run typecheck
```

Expected: both commands exit successfully with no new errors.

- [ ] **Step 3: Manually verify both locales and breakpoints**

Check an enrolled course in Arabic and English at mobile and desktop widths:

- Player/PDF viewer appears first.
- Course title, teacher, and metadata appear immediately below it.
- Curriculum follows details on mobile.
- Desktop lower section uses details and curriculum columns.
- Selecting a video or PDF keeps the same viewer position and updates progress.
- Public course pages still show their existing hero and purchase layout.
