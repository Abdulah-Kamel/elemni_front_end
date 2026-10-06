# Video Analytics Integration — Design

Date: 2026-10-04
Status: Brainstormed with the user; adversarially reviewed with Codex
(gpt-6-astra, 2 rounds); pending user spec review.
Source brief: `FRONTEND_VIDEO_ANALYTICS_DOCS.md` (backend team). Every claim
below was checked against `elemni/src/video_analytics/*`,
`elemni/src/courses/service.py`, `elemni/src/core/storage.py` and this repo.

## Goal

Enrolled students watch course videos through backend-issued signed BunnyStream
URLs. The player reports telemetry so the backend credits genuinely watched
time, completes a video at 90%, enforces watch limits, and lets students
resume on any device. Students see per-video position in the curriculum and a
"Continue Watching" tile on the dashboard.

Scope covers this repo (`elemni_front_end`) **and** two accounting fixes in
the backend repo (`elemni`), decided by the user.

## Verified facts that shape the design

| Topic | Backend reality (file) | Consequence |
|---|---|---|
| Throttle | `playing` heartbeat after a `playing` one < 15 s apart → 429, `Retry-After: 15` (`service.py` heartbeat) | Cadence **20 s** while playing |
| Credit per heartbeat | Range `[prev, min(cur, prev + elapsed)]`, elapsed = server receipt delta capped at 60 s; first heartbeat after `paused` earns nothing (baseline only) | Send `playing` immediately on every paused→playing transition |
| Completion | At 90% the attempt completes **and the session is closed** | Stop telemetry on `completed: true`; next heartbeat would 409 |
| Session replacement | Every `/playback` creates a session and closes all others on that attempt | No automatic recovery (two tabs would steal from each other) |
| Expiry | 24 h since `last_activity_at`; `/playback` then creates a new attempt if allowance permits | Expiry is recoverable via an explicit resume |
| Resume position | Signed URL is `…/embed/{lib}/{guid}?token=&expires=` — no position | Frontend must seek via player.js after ready |
| `/playback` body | Absent body ≠ `{position_sec: 0}` (absent keeps the checkpoint) | BFF forwards absence as absence |
| Allowance | `null` = unlimited; `0` = no *additional* reservation; an active attempt is resumable at 0 | Watch-limit card only when `0` **and** no active attempt |
| `/end` | Idempotent; only stamps end time, saves no position | Flush a `paused` heartbeat first |
| `PUT /my/courses/{id}/progress` | `completed:false` **removes** the item from `completed_item_ids` | Never PUT on video open |
| Public items | `bunny_stream_embed_url` is never populated | Gate on `has_video` |
| Session cookie | Access cookie `maxAge` 30 min; `authenticatedBackendFetch` returns 401 without trying refresh when it is missing; page guards check only the access cookie | Fix refresh-on-missing-access |
| `watched_percent` | Curriculum/last-watched: position ÷ duration. `/my-progress`: credited %. | Curriculum label is "reached X%", not "watched" |

## Section 0 — Backend accounting fixes (`elemni` repo)

Two defects make watch accounting wrong regardless of frontend behaviour.

**B1. New attempts inherit unproven credit.** `_create_attempt` seeds
`watched_ranges=[[0, last_position]]` from the checkpoint. A replay after
completion therefore completes on its first heartbeat and consumes a view.
Fix: a new attempt's ranges/credit are seeded **only** from the student's most
recent prior attempt for this item **if that attempt ended incomplete**
(status `expired`), copying its actual `watched_ranges` (clamped to the
current duration) and recomputing `credited_unique_seconds` from them. After a
completed attempt, or with no prior attempt, the new attempt starts with empty
ranges and zero credit. `last_position_seconds` (the resume checkpoint) is
unaffected. This preserves multi-day resume without granting unwatched time.

**B2. Position counts as credit.** The heartbeat sets
`credited_unique_seconds = max(credited, end, unique(ranges))`; `end` is a
playback position, so a seek plus two heartbeats credits the seek target.
Fix: `credited_unique_seconds = max(credited, unique(ranges))` and
`credited_percent` derived from that.

Regression tests (in `elemni/tests/video_analytics/`):
- replay after completion starts at 0 credit and does not complete on the
  first heartbeat;
- new attempt after an expired incomplete attempt inherits exactly its ranges;
- seek forward then heartbeats credits only the contiguous watched span;
- existing suites stay green.

No API shape changes; no migration (columns unchanged).

## Section 1 — Data layer (frontend)

### Contract (`src/lib/student-api/contract.ts`)

Mirror `elemni/src/video_analytics/schemas.py`:

```ts
export interface PlaybackDto {
  embed_url: string;
  attempt_id: number;
  session_id: number;
  attempt_status: "active";
  expires_in: number;
  allowance_remaining: number | null;
  allowance_source: "base" | "grant";
  completed_attempts: number;
}
export type HeartbeatState = "playing" | "paused" | "ended";
export interface HeartbeatRequestDto { sequence: number; position_sec: number; state: HeartbeatState }
export interface HeartbeatDto {
  accepted: boolean; duplicate: boolean; completed: boolean;
  watched_percent: number; last_position_sec: number;
}
export interface VideoProgressDto {
  item_id: number;
  attempt_id: number | null;
  attempt_status: "active" | "completed" | "expired" | "none";
  last_position_sec: number;
  watched_percent: number;
  completed_attempts: number;
  allowance_remaining: number | null;
  allowance_source: "base" | "grant" | null;
  last_watched_at: string | null;
  completed_at: string | null;
}
export interface LastWatchedDto {
  course_id: number; course_title: string;
  lesson_id: number; lesson_title: string;
  item_id: number; item_title: string;
  last_position_sec: number; watched_percent: number;
  is_completed: boolean; last_watched_at: string;
}
export interface ItemVideoProgressDto {
  item_id: number; last_position_sec: number; watched_percent: number; is_completed: boolean;
}
```

Extend: `EnrollmentProgressDto.video_progress?: ItemVideoProgressDto[]`
(missing → `[]`); `PublicItemDto.duration_seconds?: number | null`,
`PublicItemDto.max_watch_count?: number | null`.

### Transport and errors (`src/lib/student-api/`)

- `backend.ts`: `BackendError` gains optional `retryAfter?: string` (from the
  backend `Retry-After` header); `backendErrorResponse` re-emits it.
- `client.ts`: `StudentApiError` gains `detail?: string` and
  `retryAfterSec?: number`, parsed from the BFF response.
- New `video-analytics.ts` (browser-side transport, `studentApiFetch`-based):
  `getLastWatched()`, `getVideoProgress(itemId)`,
  `requestPlayback(itemId, positionSec?)` (omits the body when
  `positionSec` is undefined), `sendHeartbeat(sessionId, body)`,
  `endSession(sessionId, { beacon?: boolean })`.
- New `video-errors.ts`: `classifyVideoError(error) → VideoErrorKind`:

| Status | detail | Kind | UI |
|---|---|---|---|
| 401 | — | `unauthenticated` | existing redirect-to-login behaviour |
| 403 | starts `Watch limit reached` | `watch-limit` | watch-limit card |
| 403 | `Not enrolled in this course` | `not-enrolled` | "You no longer have access" |
| 403 | other (`Not authorized`, `Account is disabled`) | `forbidden` | generic error |
| 409 | `Session is no longer active` | `session-lost` | interrupted card |
| 409 | `Attempt has expired` / `Attempt is no longer active` | `attempt-ended` | interrupted card (refresh progress first) |
| 409 | `Video stream is not ready` | `processing` | "Still being processed" + retry |
| 409 | other (`not configured`, `duration is unavailable`, `Reserved grant…`) | `unavailable` | "Video unavailable — contact support" |
| 429 / 503 | — | `transient` | retry after `retryAfterSec ?? 2` |
| 404, 400, 422, other | — | `unavailable` | generic error + retry |

### BFF routes (`src/app/api/student/video-analytics/`)

Thin `authenticatedBackendFetch` passthroughs, `cache: "no-store"`. Path ids
must be positive integers → else `400 {code: "INVALID_ID"}` without a backend
call. Errors via `backendErrorResponse` (status, detail, Retry-After).

| Next route | Method | Backend |
|---|---|---|
| `last-watched` | GET | `/api/v1/video-analytics/last-watched` |
| `items/[itemId]/progress` | GET | `/my-progress/{itemId}` |
| `items/[itemId]/playback` | POST | `/videos/{itemId}/playback` |
| `sessions/[sessionId]/heartbeat` | POST | `/sessions/{sessionId}/heartbeat` |
| `sessions/[sessionId]/end` | POST | `/sessions/{sessionId}/end` |

- playback: empty body → forward with no body. Non-empty body must be JSON
  `{position_sec}` finite ≥ 0 → else `400 INVALID_PLAYBACK`.
- heartbeat: `sequence` integer ≥ 1, `position_sec` finite ≥ 0, `state` ∈
  allowed set → else `400 INVALID_HEARTBEAT`; forward only those keys.
- end: never parses the body (accepts `sendBeacon` with any content-type).

### Session refresh (`src/lib/student-api/session.ts` + guards)

- `authenticatedBackendFetch`: when the access cookie is missing but a
  refresh cookie exists, refresh first (reusing the in-flight dedupe), then
  call the backend.
- Page guards for `/dashboard` and `/my-courses/[courseId]` treat "access
  **or** refresh cookie present" as authenticated for the redirect decision.
  They do not refresh themselves (Server Components cannot set cookies); the
  first client BFF call refreshes and restores the access cookie, and a failed
  refresh yields 401 → the existing client redirect to login.
- The `/my-courses/[courseId]` login redirect's `next` param keeps the
  `item` (and `teacher`) query params so the deep link survives login.

### Query hooks (`src/features/student/hooks/use-video-analytics-queries.ts`)

- Keys: `studentQueryKeys.lastWatched()`, `studentQueryKeys.videoProgress(itemId)`.
- `useLastWatched()` — private defaults, no retry on 404.
- `useVideoProgress(itemId, enabled)` — `staleTime: 0`.
- Cache updates: each successful heartbeat writes `last_position_sec` /
  `watched_percent` into the active course query's `video_progress` entry
  (setQueryData). On completion and on controlled exit invalidate
  `myCourses()`, the course key prefix `["student","course",courseId]`,
  `videoProgress(itemId)` and `lastWatched()`.

### Gating and progress PUT fixes

- Playable item = `item.has_video || documentUrl`; all
  `bunny_stream_embed_url` reads in `course-detail.tsx` and
  `curriculum-accordion.tsx` switch to `has_video`.
- `adapters.ts` `videoUrl` and the anchor it feeds in
  `teacher-profile-view.tsx` are removed (dead: field is never populated).
- Opening a **video**: no progress PUT.
- Opening a **document**: PUT `completed: true` **only if the item has no
  video**. Items with both keep their completion owned by the video.

## Section 2 — Player (`src/features/courses/video/`)

### `player-bridge.ts` (framework-free)

Own implementation of the player.js postMessage protocol, which Bunny's embed
supports (`ready`, `play`, `pause`, `timeupdate`, `seeked`, `ended`, `error`;
methods `setCurrentTime`, `getCurrentTime`, `getPaused`).

```ts
export function createPlayerBridge(iframe: HTMLIFrameElement, embedUrl: string, opts?: {
  readyTimeoutMs?: number; // default 10_000
}): PlayerBridge;

interface PlayerBridge {
  ready: Promise<void>;                     // rejects on timeout/destroy
  on(e: "timeupdate", cb: (t: { seconds: number; duration: number }) => void): () => void;
  on(e: "play" | "pause" | "seeked" | "ended", cb: () => void): () => void;
  on(e: "error", cb: (detail: unknown) => void): () => void;
  setCurrentTime(sec: number): void;
  getCurrentTime(): Promise<number>;
  getPaused(): Promise<boolean>;
  destroy(): void;
}
```

- The window `message` listener is installed **before** the iframe `src` is
  set. Messages are accepted only if `origin === new URL(embedUrl).origin`
  and `source === iframe.contentWindow`; payloads may be JSON strings or
  objects with `context === "player.js"`; numeric values must be finite.
- Outgoing messages are JSON-serialized and posted to the exact embed origin
  (never `"*"`).
- Readiness: one `addEventListener("ready")` subscription per bridge, sent on
  iframe `load` and re-probed every 500 ms with the **same listener id**
  until ready or `readyTimeoutMs`. The deadline runs even if `load` never
  fires. Ready is processed once; probes stop on ready/destroy.
- After ready: subscribe to the events above with listener ids; `destroy()`
  sends `removeEventListener` for each and removes the window listener.
- Method calls with return values (`getCurrentTime`, `getPaused`) resolve on
  the matching listener id; time out after 3 s.

### `heartbeat-controller.ts` (framework-free, fake-timer tested)

`HEARTBEAT_INTERVAL_MS = 20_000`.

- State: `sequence` (starts 1), latest observed position, player state,
  `inFlight`, a FIFO of pending **transitions**.
- `playing` (from `play` after confirmed resume, or paused→playing): enqueue
  a `playing` heartbeat immediately; then tick every 20 s while playing.
- `pause` / `ended`: clear the tick, enqueue that state immediately.
- One request in flight. Ticks that fire while busy are skipped; transitions
  are queued and never dropped. Before sending a queued transition the body
  is rebuilt with the **latest** position. Backlog is bounded: consecutive
  queued transitions of the same state collapse to the latest.
- Ambiguous failures (network error or BFF `503 SERVICE_UNAVAILABLE`):
  retry the **same sequence and body** up to 2 times (1 s, 3 s). Then mark
  telemetry `interrupted` and stop.
- `429` / backend `503` with `Retry-After`: hold sends for that long, then
  resume with a new sequence.
- `completed: true` → `onCompleted(data)` once, then stop (session is closed
  server-side). Player keeps playing.
- `session-lost` / `attempt-ended` → `onInterrupted(kind)`, stop.
- Other classified errors → `onFatal(kind)`, stop.
- `flush()` → resolves after the queue drains (used for controlled exit).
- `stop()` clears timers; idempotent; later events are ignored.

Documented limit: elapsed credit is measured server-side at receipt, so
outages and background-tab timer throttling lose some credit; the controller
does not attempt lossless reconstruction.

### `use-video-session.ts` (hook)

States: `idle | starting | seeking | playing | interrupted(kind) |
error(kind)`; plus `sessionId`, `embedUrl`, `isCompleted`,
`lastPositionSec`.

- `start({ positionSec })` from a click only. Ignored while `starting`. Each
  call gets a generation number; a response for an older generation (item
  switched, unmounted, or re-started) is discarded **and its session is ended**
  via `endSession`.
- On success: render the iframe, create the bridge, await `ready`, clamp the
  target to duration, `setCurrentTime(target)` (skip if target is 0 and
  current is 0), confirm via `seeked`/`getCurrentTime` within ±2 s (5 s
  timeout → `error("unavailable")` with retry). When the player is actually
  playing (`play` event or `getPaused() === false`), start the controller with
  the observed position.
- Bridge `error` event or ready timeout → `error` state with retry; retry
  calls `/playback` again with `lastPositionSec` (fresh signed URL). Healthy
  iframes are never reloaded on a timer.
- `onInterrupted` → `interrupted` state: refresh `videoProgress`, show
  "Playback paused here — resume" which calls `start({ positionSec:
  lastPositionSec })`. No automatic recovery.
- Controlled exit (item switch, unmount): `await controller.flush()` after
  enqueuing `paused` with latest position, then `endSession` (fetch
  `keepalive`). `pagehide`: `navigator.sendBeacon(endUrl)`; if it returns
  false, fall back to `fetch(..., {keepalive: true})`. On `pageshow` with
  `persisted` (bfcache restore) the hook resets to `interrupted`.
- The selected item is frozen while a session exists: completion refetches
  must not change what the player shows (see Section 3 freeze).

### UI (`learner-player.tsx` + `video-preview-card.tsx`)

Video item with session `idle` → `VideoPreviewCard` from
`useVideoProgress(itemId)`. Precedence top to bottom:

| Condition | Content | Action |
|---|---|---|
| loading | skeleton | — |
| error | classified copy | Retry |
| `allowance_remaining === 0 && attempt_status !== "active"` | "Watch limit reached" + WhatsApp link (`WHATSAPP_URL`) | — |
| `attempt_status === "active"` and `last_position_sec > 0` | "Resume from {m:ss}" | Resume → `start({positionSec: last_position_sec})` |
| `completed_attempts > 0` | "You've completed this video" | Watch again → `start({positionSec: 0})` |
| otherwise | "Start watching" (or "Resume from" if `last_position_sec > 0`) | Play |
| `allowance_remaining !== null` (any row with an action) | footnote "{n} more views available" (ICU plural) | — |

Interrupted state reuses the card with "Playback paused here" + Resume. While
`starting`/`seeking` the iframe is mounted under a loading overlay. The info
bar shows a "Completed" pill when `isCompleted` or the item is already
complete. `formatPlaybackTime(sec)` → `m:ss` / `h:mm:ss`, Latin digits, in a
`dir="ltr"` span. Strings under `courseDetail.video.*` in ar/en; logical
utilities only.

## Section 3 — Curriculum progress

- `course-detail.tsx` builds `videoProgress: Map<number,
  ItemVideoProgressDto>` from `enrollment.progress.video_progress ?? []` and
  passes it to `CurriculumAccordion` / `LearnerCurriculumSidebar`.
- Effective completion = `completedItemIds.includes(id) ||
  videoProgress.get(id)?.is_completed`; drives the pill and the sidebar count.
- Video rows with `0 < watched_percent < 100`, not completed: thin bar,
  `role="progressbar"`, aria-label "Reached {n}%".
- **Selection freeze:** once the student selects an item or playback starts
  (including the inferred initial item and `?item=` deep link), store it in
  `activeContent` so later `next_item_id` changes do not switch the player.

## Section 4 — Continue Watching

- The dashboard Resume tile calls `useLastWatched()` alongside the existing
  my-courses data.
- Use last-watched only if `course_id` is among the student's enrollments
  (the dashboard already has them). Then:
  - not completed → course title, "{lesson} › {item}", "at {m:ss}",
    position bar, link `/my-courses/{course_id}?item={item_id}`;
  - completed → existing behaviour for that enrollment (next item).
- 404 / error / loading / course not enrolled → existing behaviour unchanged.
- Deep link: `my-courses/[courseId]/page.tsx` reads `item` (positive integer,
  else ignored) → `CourseDetail initialItemId`, preferred over
  `next_item_id`/`last_item_id` for the initial selection and expanded
  chapter/lesson. Opens the preview card (no autoplay).

## Testing

Frontend (Vitest/jsdom):
- `player-bridge`: origin/source filtering, string/object payloads, probe
  with same listener id, single ready, timeout without `load`, method
  replies, destroy unsubscribes.
- `heartbeat-controller`: 20 s cadence; immediate pause/ended/resume;
  sequence monotonic; single in-flight; queued transitions with latest
  position and collapse; same-sequence retry on ambiguous failure then
  `interrupted`; Retry-After hold; completion stops once; delayed request +
  rapid transitions.
- `video-errors` table; `formatPlaybackTime`.
- `use-video-session`: double-click guard, superseded response ends its
  session, seek confirmation, flush-then-end ordering, beacon fallback,
  bfcache restore.
- `VideoPreviewCard` precedence table in ar + en.
- Curriculum bar + effective completion; selection freeze across refetch.
- Dashboard tile: last-watched enrolled / not enrolled / completed / 404.
- `session.ts`: refresh when access cookie missing.
- Route tests for each BFF handler (ids, bodies, absent-body playback,
  Retry-After passthrough, beacon end).

E2E (Playwright, route mocks — no real enrollments locally): enrolled
`/my-courses/[id]` with BFF video routes stubbed and a fake embed page
emitting player.js messages: resume → seek → heartbeat → completion pill;
watch-limit card; interrupted → resume.

Backend: Section 0 tests + full `elemni/tests/video_analytics` suite.

Manual: one real Bunny library check of player.js events, seek, and playback
past the 1 h signed-URL expiry (documented result in the PR).

Gates: frontend `npm run build`, `npm run lint`, `npm run test`; backend
the repo's pytest command.

## Out of scope

Teacher/admin grant UI; mobile; touch-only progress endpoint (dropped by not
PUTting on video open); custom player chrome.
