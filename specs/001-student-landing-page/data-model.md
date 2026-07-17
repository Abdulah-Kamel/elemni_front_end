# Data Model: Student Landing Page (Default)

**Branch**: `001-student-landing-page` | **Date**: 2026-07-17

This feature is **frontend-only**. The entities below describe what the student
landing displays and what it sends to the backend (Contact Us). None of these
entities are persisted by this repo; their authoritative source is the separate
backend API. The frontend renders them from API responses parsed at the
boundary (zod) per constitution Article II. Field-level validation here is the
*zod* schema used for boundary parsing — NOT a client-side business rule.

See `contracts/` for the corresponding zod schemas.

---

## Entities

### Subject
A subject offered on the platform (e.g., Mathematics), shown on the student
landing so prospective learners can explore lessons.

- **id**: string (UUID or backend-defined identifier; Latin digits in code/URLs)
- **slug**: string (URL-safe, locale-independent identifier for routing)
- **name**: LocalizedText — `{ ar: string; en: string }` (rendered per locale)
- **icon**: string | null (icon key or static image path; optional)
- **gradeIds**: string[] — relationship to `Grade` (ids of grades this subject covers)
- **streamIds**: string[] — relationship to `Stream` (ids of streams this subject maps to)
- **lessonsCount**: number — display-only count rendered from the API; NEVER computed client-side
- **featured**: boolean — whether to surface in the "Featured Content" carousel

**Validation**:
- `id`, `slug`, `name.ar`, `name.en` are required (non-empty strings).
- `lessonsCount` is a non-negative integer; if absent, the UI renders a skeleton instead of `0` (so a missing field is not confused with "no lessons").
- `gradeIds`/`streamIds` may be empty arrays but must be present.

**Relationships**:
- `Subject` N↔N `Grade` (a subject belongs to many grades; a grade offers many subjects).
- `Subject` N↔N `Stream` (a subject belongs to many streams; a stream offers many subjects).
- `Subject` 1→N `Featured Content` entries.

---

### Grade
An educational level used to scope browsable lessons.

- **id**: string
- **slug**: string
- **name**: LocalizedText — `{ ar: string; en: string }`
- **order**: number — display sort order (integer; lower renders first in lists)
- **subjectIds**: string[] — relationship to `Subject`

**Validation**:
- `id`, `slug`, `name.ar`, `name.en` required.
- `order` is a non-negative integer (defaults to 0 if absent).

**Relationships**:
- `Grade` N↔N `Subject`.
- `Grade` 1→N `Stream` (a grade has many streams).

---

### Stream
A track within a grade (e.g., scientific, literary) used to filter browsable content.

- **id**: string
- **slug**: string
- **name**: LocalizedText — `{ ar: string; en: string }`
- **gradeId**: string — relationship to `Grade`
- **subjectIds**: string[] — relationship to `Subject`

**Validation**:
- `id`, `slug`, `name.ar`, `name.en`, `gradeId` required.

**Relationships**:
- `Stream` N→1 `Grade`.
- `Stream` N↔N `Subject`.

---

### Featured Content
A curated selection of lessons or subject highlights shown on the landing to
encourage exploration.

- **id**: string
- **title**: LocalizedText
- **description**: LocalizedText (short, ≤ ~200 chars per locale)
- **thumbnailUrl**: string | null — must be used with explicit `width`/`height` via `next/image`
- **linkType**: enum — `"lesson" | "subject" | "external"`
- **linkTarget**: string — slug or URL depending on `linkType`
- **subjectId**: string | null — back-reference to `Subject` if `linkType === "subject"`
- **displayOrder**: number

**Validation**:
- `id`, `title.ar`, `title.en` required.
- `linkType` must be one of the enum values.
- `linkTarget` required and non-empty for `linkType` ∈ `{"lesson","external"}`; for `linkType === "subject"`, `subjectId` required.

**State Transitions**: None — this entity is read-only display data.

---

### Contact Entry (Contact Us submission)
The payload received from the visitor through the "Contact Us" section. v1 will
rely on a `mailto:` fallback when the backend contact endpoint is absent, so
this entity is the **target shape** the future Server Action will produce and
zod-validate.

- **name**: string
- **email**: string (RFC 5322 shape; validated for fast feedback, NOT for trust per Article XII)
- **subject**: string (free-text, ≤ ~120 chars)
- **message**: string (free-text, ≤ ~2000 chars)
- **locale**: `"ar" | "en"` — forwarded to the backend so email replies are localized

**Validation (zod, fast feedback only; backend revalidates)**:
- `name`: non-empty string, 1–120 chars.
- `email`: non-empty, well-formed email.
- `subject`: optional; if present, 1–120 chars.
- `message`: required, 1–2000 chars.
- `locale`: enum.

**Submission State Machine** (Client UI states, NOT backend states — backend is authoritative):
- `idle → submitting → success` (only after API confirms — Article V)
- `idle → submitting → error` (mapped to typed error code: `Unauthorized | Validation | Upstream | RateLimited | …`)
- `error → idle` (visitor retries)

Constitution V: NO optimistic "success". The UI stays in `submitting` until the
backend acknowledges.

---

### Localization Container (cross-cutting)

- **LocalizedText**: `{ ar: string; en: string }` — canonical shape for any
  user-facing string coming from the API. The frontend renders
  `text[locale]`; if either locale is missing, the zod parse fails at the
  boundary (Article II), and the UI renders a skeleton/fallback rather than
  a half-localized string.

---

## Notes

- Currency fields (e.g., lesson prices, if surfaced in Featured Content later)
  MUST arrive as integer piastres and render through `Intl.NumberFormat("ar-EG",
  { style:"currency", currency:"EGP" })`. No float, no client-side arithmetic
  (constitution Article IX). Out of v1 scope.
- No entity in this model is owned/persisted by this repo. "Validation" here
  means the zod schema used to parse API responses at the boundary; it is NOT a
  client-side business rule (Articles I and II).
- Cache strategy per entity (Article X): `Subject`, `Grade`, `Stream`,
  `Featured Content` → `revalidate: 3600`, tag `curriculum`. `Contact Entry`
  is a mutation, never cached.