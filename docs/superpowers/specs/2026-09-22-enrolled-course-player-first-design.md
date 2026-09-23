# Enrolled Course Player-First Layout

## Goal

Reorder the enrolled student course-detail page so the active video or PDF viewer is the first learning surface, followed by course details, with curriculum navigation below. Public course-detail pages must remain unchanged.

## Current Context

`CourseDetail` currently renders the enrolled content column with the course hero/details before `LearnerPlayer`. The enrolled curriculum sidebar is rendered as the sibling column in the desktop grid. `LearnerPlayer` already supports both Bunny video embeds and PDF iframes, including PDF download and open-in-new-tab actions.

## Approved Layout

For enrolled users only:

```text
Active video/PDF viewer
Course details
Course curriculum and lesson navigation
```

On desktop, the viewer spans the course-detail content width. Beneath it, course details and curriculum use a two-column layout. On mobile, all three sections stack vertically in the same order.

Public mode keeps its existing hero, purchase panel, and curriculum arrangement.

## Behavior

- Preserve automatic selection of the resume/first playable item.
- Preserve video playback and PDF opening behavior.
- Preserve progress mutation when selecting or opening enrolled content.
- Preserve curriculum expansion, active-item highlighting, and completed-item state.
- Preserve public mode and unauthenticated purchase flows without layout changes.
- Keep the player scroll target and accessible heading semantics intact.

## Component Direction

- Keep `LearnerPlayer` unchanged unless a small layout-specific class adjustment is required.
- Adjust `CourseDetail` composition so enrolled rendering has a dedicated player-first structure.
- Reuse existing `CourseHero` for course details rather than duplicating content.
- Reuse `LearnerCurriculumSidebar` for navigation and retain its desktop scrolling behavior.
- Avoid changes to API contracts, data loading, checkout, or progress logic.

## Responsive and Accessibility Requirements

- The player must remain usable at narrow mobile widths without horizontal overflow.
- The PDF iframe must retain its viewport-based height.
- The video iframe must retain its 16:9 presentation.
- The active viewer remains discoverable by the `course-player` landmark/section.
- Course details and curriculum must follow the same DOM order as the visual order for keyboard and screen-reader users.

## Verification

- Add or update component tests proving enrolled mode renders the player before the course details and curriculum.
- Verify public mode does not render the enrolled player-first structure.
- Run the existing course-detail component tests and the frontend lint/typecheck gate.
- Check Arabic RTL and English LTR layouts at mobile and desktop widths.
