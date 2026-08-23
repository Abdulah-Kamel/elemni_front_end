# Feature Specification: Student Landing Page (Default)

**Feature Branch**: `001-student-landing-page`

**Created**: 2026-07-17

**Status**: Draft

**Input**: User description: "we want another landing page for the student and it is going to be the default one and the one for teacher will live at another page or another subdomain"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prospective Student Discovers the Platform (Priority: P1)

A first-time visitor opens the site's root address and is shown a landing page
addressed to **students**: it introduces what Elemni offers learners, surfaces
the most relevant subjects/grades/streams, and provides clear calls to action
to browse lessons, sign up, or sign in. The page is the default destination for
anyone who arrives at the platform without specifying a role. The teacher
experience is intentionally not the focus here — it lives at a separate page or
subdomain.

**Why this priority**: This is the core promise of the feature — a default,
student-facing front door. Without it the feature does not exist.

**Independent Test**: Open the root URL in a fresh private session and confirm
the visible content is student-oriented and exposes working links to browse
content, sign up, and sign in.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor has never specified a role, **When** they
   open the site's root address, **Then** the student landing page is displayed
   in Arabic, right-to-left, as the default.
2. **Given** the student landing page is displayed, **When** the visitor follows
   the "browse lessons/content" call to action, **Then** they reach a page where
   they can explore available lessons organized by subject, grade, and stream
   without being required to sign in first.
3. **Given** the student landing page is displayed, **When** the visitor follows
   the sign-up call to action, **Then** they reach the student registration
   entry point.
4. **Given** the student landing page is displayed, **When** the visitor follows
   the sign-in call to action, **Then** they reach the student sign-in entry
   point.

---

### User Story 2 - Visitor Switches Language and Locale Direction (Priority: P2)

A visitor on the student landing page toggles between Arabic and English. The
page re-renders fully localized in the selected language with correct text
direction (RTL for Arabic, LTR for English) and locale-appropriate numerals and
fonts.

**Why this priority**: The platform is RTL-first for Egyptian students, but
English support is part of the product. Correctness of locale direction is a
non-negotiable quality gate, second only to the landing existing at all.

**Independent Test**: Load the root URL, toggle the language to English, then
back to Arabic, and confirm the entire page — including direction-implying
icons and layout — mirrors correctly in both directions.

**Acceptance Scenarios**:

1. **Given** the student landing page is shown in Arabic (RTL), **When** the
   visitor selects English, **Then** the page renders in English with
   left-to-right direction and Latin digits where appropriate.
2. **Given** the student landing page is shown in English (LTR), **When** the
   visitor selects Arabic, **Then** the page renders in Arabic with
   right-to-left direction and Arabic-Indic numerals where appropriate.
3. **Given** the language is toggled, **When** the toggle completes, **Then**
   no user-facing string remains untranslated in either language.

---

### User Story 3 - Visitor Reaches the Teacher Experience Separately (Priority: P3)

A visitor who is a teacher (or needs teacher-oriented information) does not get
the student landing page as their final destination. They can reach a dedicated
teacher landing page located at a distinct page or subdomain, and that teacher
landing is not surfaced as the default for general visitors.

**Why this priority**: The feature's scope is the **student** default landing;
the teacher landing is referenced here only to define the boundary (it exists
elsewhere). The teacher landing's own content is out of scope for this spec.

**Independent Test**: Starting from the student landing, confirm there is a
discoverable path to the teacher landing at the distinct location, and confirm
the distinct teacher location does not serve as the root/default.

**Acceptance Scenarios**:

1. **Given** the student landing page is the default at the root address,
   **When** a visitor navigates to the distinct teacher page or subdomain,
   **Then** they reach a teacher-oriented landing, not the student one.
2. **Given** a visitor arrives at the teacher landing location, **When** they
   navigate back to the root address, **Then** the student landing is shown.
3. **Given** the student landing is displayed, **When** a visitor looks for a
   link to the teacher experience, **Then** such a link is discoverable and
   points to the distinct teacher location.

---

### Edge Cases

- What happens when a visitor has a stale/invalid session at the root URL?
  They should still see the student landing page; broken sessions must not
  block the landing from rendering.
- What happens when the backend endpoints that feed landing content (subjects,
  featured lessons, etc.) are unavailable or slow on a 3G mobile connection?
  The landing must still render with graceful fallback (skeletons, retry, or
  statically available marketing content) rather than a blank page.
- What happens when a visitor deep-links to the root with a different
  `Accept-Language` than Arabic? Arabic remains the default unless the visitor
  explicitly selects another language (per the RTL-first principle).
- What happens when a visitor follows a call to action that requires an account
  they don't have? They reach the relevant auth entry point with enough context
  to continue.
- What happens when the teacher landing is reached but a student tries to act
  on teacher-only calls to action? Such actions must route the student to the
  appropriate auth/qualification flow; the student landing must not make
  teacher-only promises.
- The link from the student landing to the teacher landing lives in the page
  footer (e.g., a "For Teachers" link) to keep the student-focused content
  uncluttered while remaining reachable by teachers who look there.
- What happens when a visitor uses the "Contact Us" section at the bottom of
  the page? They should find a clearly visible contact entry point (e.g.,
  contact form, email, or contact details) in the footer/bottom area of the
  landing, available without signing in, in both Arabic and English.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST serve a student-oriented landing page at the
  site's root address as the default destination for any visitor who has not
  specified a role.
- **FR-002**: The student landing page MUST be delivered in Arabic as the
  default locale with right-to-left text direction.
- **FR-003**: The student landing page MUST provide a visitor-visible control
  to switch between Arabic (RTL) and English (LTR), and switching MUST fully
  re-localize the page including text, numerals, fonts, and direction-implying
  icons.
- **FR-004**: The student landing page MUST display student-focused content:
  what learners can browse/buy, highlights of available subjects, grades, and
  streams, and at least one path to start exploring lessons without being forced
  to sign in.
- **FR-005**: The student landing page MUST surface clear calls to action for:
  browsing lessons/content, signing up as a student, and signing in as a
  student.
- **FR-006**: The teacher landing page MUST NOT occupy the root address; it
  MUST live at a distinct page path or subdomain separate from the student
  default landing.
- **FR-007**: The student landing page MUST NOT serve teacher-only content or
  teacher-only calls to action as its primary focus.
- **FR-008**: The student landing page MUST render within reasonable
  first-paint budgets for a constrained mobile connection (3G-class device),
  using skeleton/fallback states for any content loaded from the backend so the
  page is never blank while data loads.
- **FR-009**: The student landing page MUST be fully usable without JavaScript
  for all purely informational content and primary navigation calls to action;
  interactive enhancements may layer on top but must not gate the core
  discovery experience.
- **FR-010**: The student landing page MUST remain functional when the backend
  is slow or unreachable, falling back to statically available marketing content
  and clear retry/options rather than a broken page.
- **FR-011**: A path from the student landing to the distinct teacher landing
  location MUST exist and be discoverable to visitors who need it, placed in
  the page footer as a clearly labeled link (e.g., "For Teachers") to avoid
  competing with the student-focused content above.
- **FR-012**: The student landing page MUST include a "Contact Us" section at
  the bottom of the page that provides a clear, no-sign-in-required way for
  visitors to reach out (e.g., a contact form, email address, or other contact
  details), reachable from the main landing view.
- **FR-013**: The "Contact Us" section MUST be fully localized in both Arabic
  and English, including labels, placeholders (if a form is used), and any
  submission feedback/errors.

### Key Entities *(include if feature involves data)*

- **Subject**: An academic subject (e.g., Mathematics) offered on the platform,
  used to organize browsable lessons for students.
- **Grade**: An educational level used to scope lessons and subjects for the
  browsing experience.
- **Stream**: A track within a grade (e.g., scientific/literary) used to filter
  browsable content.
- **Featured Content**: A curated selection of lessons or subject highlights
  shown to prospective students on the landing to encourage exploration.
- **Call to Action**: A labeled, localized action entry point (browse, sign up,
  sign in, go to teacher experience) presented on the landing.
- **Contact Entry**: The "Contact Us" section's contents — a form (if used)
  with its fields, an email address, or other contact details — through which
  visitors can reach the platform without signing in.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor reaching the root address sees the
  student-oriented landing render within 3 seconds on a 3G-class mobile
  connection.
- **SC-002**: 100% of user-facing strings on the student landing appear fully
  translated in both Arabic and English with correct text direction after a
  language toggle.
- **SC-003**: At least 90% of first-time visitors who complete the landing
  experience can identify, within 15 seconds, where to browse lessons and where
  to sign up or sign in.
- **SC-004**: The root address serves the student landing for 100% of
  unauthenticated visits, and the teacher landing is reachable at a distinct
  location that is not the root.
- **SC-005**: The student landing remains visible and navegable (skeleton or
  fallback content shown) for at least 99% of visits even when backend content
  endpoints are slow or unavailable.
- **SC-006**: A visitor can switch language on the landing and reach a
  correctly mirrored layout in the new locale in under 1 second after toggle.
- **SC-007**: A visitor can locate the "Contact Us" section and the "For
  Teachers" link in the footer within 10 seconds of viewing the bottom of the
  landing, in both Arabic and English.

## Assumptions

- Visitors are prospective or returning **students** by default when they
  arrive at the root address without specifying a role.
- Arabic is the default and primary locale of the product, in line with the
  platform's RTL-first positioning for Egyptian students.
- Existing backend endpoints (or planned ones) provide the lesson/subject/grade/
  stream catalog the landing needs to surface; if such endpoints are missing,
  the landing degrades gracefully to statically available content and a "name
  the endpoint and its shape" request is raised rather than fabricating data
  client-side.
- The frontend never owns business rules or money/auth decisions; the landing
  only displays data and routes to flows the backend authorizes.
- The distinct teacher location (separate page or subdomain) is owned by a
  related effort; this spec only defines the boundary and a discoverable path
  to it, not the teacher landing's content.
- User-facing copy is localized through the platform's i18n system; no
  hardcoded strings are shipped to users.
- Existing authentication and sign-up entry points for students are reused;
  the landing links to them rather than reimplementing them.
- Performance is budgeted for constrained mobile networks, per the platform's
  performance guidance.