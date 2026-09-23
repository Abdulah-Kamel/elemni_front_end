# Enrolled Theater Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an enrolled-only theater-mode toggle that, when enabled, makes the player full-width with curriculum and details stacked below (order: video → curriculum → details) on desktop and mobile; when disabled (default), keep the player and curriculum side by side with details under the player column.

**Architecture:** Keep theater state in `CourseDetail`, where it already owns enrolled layout and active content. Pass the state and setter callback into `LearnerPlayer`. Render the enrolled layout as a single grid. When theater mode is off, the grid's first column holds the player + `CourseHero` wrapper and its second column holds `LearnerCurriculumSidebar` (two-column classes: `lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]`). When theater mode is on, the grid uses `lg:grid-cols-1` and `CourseHero` is rendered after `LearnerCurriculumSidebar`, so the DOM order is player → curriculum → details. The player wrapper stays the grid's first child in both states so the player never remounts. Public mode, API data, progress, checkout, and iframe behavior remain unchanged.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, next-intl, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-22-enrolled-theater-mode-design.md`

## Global Constraints

- Applies only to enrolled course-detail pages.
- Public course pages and purchase flows remain unchanged.
- State is local to the current course page and resets on navigation/reload.
- Mobile remains vertically stacked in either mode, following the same vertical order as desktop (theater off: player → details → curriculum; theater on: player → curriculum → details).
- Theater mode is off by default.
- Switching lessons does not reset theater mode.
- Switching to a PDF keeps the selected layout state, but the video-specific toggle is not shown for PDF content.
- Existing resume selection, progress mutation, video playback, PDF viewing/download, and curriculum interactions remain unchanged.
- The toggle is a real button with keyboard support and `aria-pressed`.
- Video remains 16:9 and PDF remains viewport-height constrained.

---

### Task 1: Add theater-mode regression tests

**Files:**
- Modify: `src/features/courses/components/course-detail.container.test.tsx`
- Modify: `src/features/courses/components/learner-player.test.tsx` if an existing unit test file is present; otherwise cover the behavior in `course-detail.container.test.tsx`.

**Interfaces:**
- Consumes: Existing enrolled fixture, `CourseDetail`, and `LearnerPlayer` rendering.
- Produces: Tests that define `theaterMode` default-off behavior, toggle state, layout class changes, PDF preservation, and public-mode isolation.

- [ ] **Step 1: Add a failing default-off/layout assertion**

In the enrolled course-detail test, assert the lower grid initially has the two-column class and the video player exposes a theater button with `aria-pressed="false"`:

```ts
const enrolledLayout = document.querySelector("[data-enrolled-layout]");
expect(enrolledLayout).toHaveClass("lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]");
expect(screen.getByRole("button", { name: /theater/i })).toHaveAttribute("aria-pressed", "false");
```

Use the `data-enrolled-layout` marker defined in Task 3 so the tests do not depend on Tailwind class serialization.

- [ ] **Step 2: Add a failing toggle-on/toggle-off assertion**

Click the theater button, then assert the button state, single-column layout, and the exact enrolled order (player → curriculum → details). Click again and assert restoration to player → details → curriculum:

```ts
const theaterButton = screen.getByRole("button", { name: /theater/i });
const follows = (a: Node, b: Node) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
const player = document.querySelector("#course-player");
const title = screen.getByRole("heading", { name: "كورس التفاضل" });
const curriculumSidebar = screen.getByTestId("learner-curriculum-sidebar");

fireEvent.click(theaterButton);
expect(theaterButton).toHaveAttribute("aria-pressed", "true");
expect(enrolledLayout).toHaveClass("lg:grid-cols-1");
expect(follows(player!, curriculumSidebar)).toBeTruthy();
expect(follows(curriculumSidebar, title)).toBeTruthy();

fireEvent.click(theaterButton);
expect(theaterButton).toHaveAttribute("aria-pressed", "false");
expect(enrolledLayout).toHaveClass("lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]");
expect(follows(player!, title)).toBeTruthy();
expect(follows(title, curriculumSidebar)).toBeTruthy();
```

- [ ] **Step 3: Add PDF and public isolation assertions**

Use the existing PDF interaction test to assert the PDF remains rendered and the selected theater state is retained when switching from video to PDF. In the public-mode test, assert no theater button is rendered and no enrolled layout marker exists.

- [ ] **Step 4: Run the focused tests and verify the new assertions fail**

Run:

```bash
npx vitest run src/features/courses/components/course-detail.container.test.tsx
```

Expected: existing tests pass, while new theater assertions fail because no theater state/control exists yet.

### Task 2: Implement theater state and player control

**Files:**
- Modify: `src/features/courses/components/course-detail.tsx`
- Modify: `src/features/courses/components/learner-player.tsx`
- Modify: `src/messages/ar.json`
- Modify: `src/messages/en.json`

**Interfaces:**
- Consumes: Existing `visibleActiveContent`, `enrolled` branch, and `LearnerPlayer` active-content props.
- Produces: `LearnerPlayer` props `{ activeContent, theaterMode, onTheaterModeChange }` and a localized video-only toggle with `aria-pressed`.

- [ ] **Step 1: Add local state in `CourseDetail`**

Near the existing course-detail state declarations, add:

```ts
const [theaterMode, setTheaterMode] = useState(false);
```

Do not reset this state when `activeContent` changes. Pass it to the enrolled `LearnerPlayer` as `theaterMode={theaterMode}` and `onTheaterModeChange={setTheaterMode}`.

- [ ] **Step 2: Add the localized video toggle to `LearnerPlayer`**

Extend the component props with:

```ts
theaterMode: boolean;
onTheaterModeChange: (enabled: boolean) => void;
```

Render a real button in the player metadata/control area only when `activeContent.type === "video"`:

```tsx
<button
  type="button"
  aria-pressed={theaterMode}
  onClick={() => onTheaterModeChange(!theaterMode)}
  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-black text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7DD3FC]"
>
  {theaterMode ? t("exitTheaterMode") : t("enterTheaterMode")}
</button>
```

Use the existing icon language and styling conventions. Do not change iframe `src`, aspect ratio, PDF height, download link, or open-document link.

- [ ] **Step 3: Add Arabic and English messages**

Add `enterTheaterMode` and `exitTheaterMode` under the existing course-detail translation namespace, with actionable localized labels such as “Enable theater mode” / “Disable theater mode” and their Arabic equivalents.

- [ ] **Step 4: Run focused tests and verify they pass**

Run:

```bash
npx vitest run src/features/courses/components/course-detail.container.test.tsx
```

Expected: all course-detail tests pass, including default-off, toggle, PDF, and public isolation assertions.

### Task 3: Implement responsive enrolled grid switching

**Files:**
- Modify: `src/features/courses/components/course-detail.tsx`

**Interfaces:**
- Consumes: `theaterMode` from Task 2.
- Produces: Stable enrolled layout marker and responsive class switching.

- [ ] **Step 1: Add a stable enrolled layout marker**

Add `data-enrolled-layout` to the enrolled grid that contains both the player column and the curriculum sidebar so tests and browser checks can identify the exact layout container without relying on Tailwind-generated selectors. The player must be a descendant of this grid (inside the first column), not a sibling above it.

- [ ] **Step 2: Switch the desktop grid columns and reorder details in theater mode**

Keep `AnimatePresence` + `LearnerPlayer` inside the grid's first child wrapper (`min-w-0 space-y-8`). Render `CourseHero` inside that wrapper only when `theaterMode` is false, and render it after `LearnerCurriculumSidebar` (as a direct grid child) when `theaterMode` is true, so theater-on DOM order is player → curriculum → details. Use conditional grid classes that preserve mobile stacking:

```tsx
className={cn(
  "grid items-start gap-8",
  theaterMode
    ? "lg:grid-cols-1"
    : "lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]",
)}
```

The player wrapper stays the first grid child in both states so the player never remounts. Theater off yields player/details left and curriculum right on desktop (DOM order player → details → curriculum); theater on yields a single full-width stack in DOM order player → curriculum → details. Do not change the public `!enrolled` branch.

- [ ] **Step 3: Run all focused course-detail tests**

Run:

```bash
npx vitest run src/features/courses/components/course-detail.container.test.tsx
```

Expected: all tests pass with both layout states covered.

### Task 4: Run quality and responsive verification

**Files:**
- Modify: none unless a focused verification exposes an implementation defect.

**Interfaces:**
- Consumes: Completed theater-mode implementation.
- Produces: Evidence that the toggle, responsive layouts, locales, and public isolation work.

- [ ] **Step 1: Run lint and TypeScript**

Run:

```bash
npx eslint src/features/courses/components/course-detail.tsx src/features/courses/components/learner-player.tsx src/features/courses/components/course-detail.container.test.tsx
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 2: Verify browser states**

Check enrolled course behavior in Arabic and English at mobile and desktop widths:

- Default state is non-theater: desktop shows player and curriculum side by side with details under the player.
- Enabling theater makes the player full-width first, with curriculum and details stacked below in that order (video → curriculum → details), on desktop and mobile.
- Disabling theater restores the player/details | curriculum desktop layout (player → details → curriculum).
- Mobile remains stacked in both states.
- Switching video lessons preserves theater state.
- Switching to PDF preserves layout state and hides the video-only toggle.
- Public course pages show no theater control and retain their existing layout.
