# Enrolled Theater Mode

## Goal

Add a theater-mode toggle to the enrolled course player. Theater mode is off by default. When off, the player and curriculum sit side by side on desktop with course details below the player column. When on, the player goes full-width first, then curriculum, then course details stack below it.

## Scope

- Applies only to enrolled course-detail pages.
- Public course pages and purchase flows remain unchanged.
- State is local to the current course page and resets on navigation/reload.
- Mobile remains vertically stacked in either mode.

## Layout States

### Theater Off (default)

```text
Desktop:
Player   | Curriculum
Details  |

Mobile:
Player
Details
Curriculum
```

The enrolled page is a two-column desktop grid: the left column contains the player with course details beneath it; the right column is the curriculum sidebar.

### Theater On

```text
Desktop and Mobile:
Player
Curriculum
Details
```

The same enrolled grid switches to one column, and the course details (`CourseHero`) are rendered after the curriculum sidebar, so the enrolled content reads video → curriculum → details on both desktop and mobile. Theater mode reorders only the details block; the player stays in the grid's first slot and is never remounted.

## Interaction

- `CourseDetail` owns `theaterMode` with an initial value of `false`.
- `LearnerPlayer` receives `theaterMode` and an `onTheaterModeChange` callback.
- The toggle is rendered for video content, uses `aria-pressed`, and has localized English/Arabic labels.
- Switching lessons does not reset theater mode.
- Switching to a PDF keeps the selected layout state, but the video-specific toggle is not shown for PDF content.
- Existing resume selection, progress mutation, video playback, PDF viewing/download, and curriculum interactions remain unchanged.

## Component Changes

- `course-detail.tsx`: keep local theater state, pass it to `LearnerPlayer`, and render the enrolled player inside the layout grid's first column; render `CourseHero` beneath the player when theater mode is off and after `LearnerCurriculumSidebar` when theater mode is on; switch the enrolled grid between two-column and single-column classes.
- `learner-player.tsx`: add the video theater toggle control without changing iframe sizing or content URLs.
- Course-detail translations: add localized toggle labels and accessible state text if the existing translation structure requires new keys.
- Course-detail tests: cover default-off behavior, toggle state, desktop layout class changes, and public-mode isolation.

## Accessibility and Responsive Behavior

- The toggle is a real button with keyboard support and `aria-pressed`.
- Its accessible name describes the action/state in the active locale.
- DOM order is player → details → curriculum when theater mode is off (player and details share the first grid column; curriculum is the second column) and player → curriculum → details when theater mode is on.
- No horizontal overflow is introduced at mobile widths.
- Video remains 16:9 and PDF remains viewport-height constrained.

## Verification

- Focused component tests pass for video default-off, toggle-on, toggle-off, and PDF behavior, asserting the exact enrolled content order in both theater states.
- Public mode has no theater control and no enrolled layout changes.
- Typecheck and lint pass without new errors.
- Browser checks cover Arabic/English and mobile/desktop states.
