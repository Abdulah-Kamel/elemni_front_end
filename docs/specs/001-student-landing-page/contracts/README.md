# Contracts: Student Landing Page (Default)

**Branch**: `001-student-landing-page` | **Date**: 2026-07-17

Public-facing API contracts the student landing consumes. Frontend-only repo;
the backend is a separate deploy. Every response below is zod-parsed at the
boundary before any use (constitution Article II). These schemas are the
frontend's authoritative shapes; TS types are inferred from them — never
declared separately. Each schema MUST ship with a contract test asserting it
against a live staging fixture in CI (constitution Article XIII).

These are **named endpoint requests** raised to the backend team, NOT endpoints
this repo implements. When the backend is absent or unreachable, the student
landing renders static fallback content (see `research.md` R3, R8).

Common:

- All endpoints return JSON with `Content-Type: application/json`.
- Error responses use the documented typed taxonomy (see `common-error.md`).
- The client forwards `Accept-Language: ar|en` and a request ID header; the API
  returns localized errors (Article VIII).
- Caching: catalog GETs use `revalidate: 3600`, tag `curriculum`; money and any
  authenticated read are `cache: "no-store"` (Article X).

Files:

```text
contracts/
├── README.md                  # this file
├── common-error.md            # typed error taxonomy
├── subject.zod.md             # GET /v1/subjects
├── grade.zod.md               # GET /v1/grades
├── stream.zod.md              # GET /v1/streams
├── featured-content.zod.md    # GET /v1/featured-content
└── contact.zod.md             # POST /v1/contact
```

| Endpoint | Method | Auth | Cache | Parser |
|----------|--------|------|-------|--------|
| `/v1/subjects` | GET | public | revalidate 3600, tag `curriculum` | `SubjectSchema[]` |
| `/v1/grades` | GET | public | revalidate 3600, tag `curriculum` | `GradeSchema[]` |
| `/v1/streams` | GET | public | revalidate 3600, tag `curriculum` | `StreamSchema[]` |
| `/v1/featured-content` | GET | public | revalidate 3600, tag `curriculum` | `FeaturedContentSchema[]` |
| `/v1/contact` | POST | public (rate-limited) | never cached | `ContactResponseSchema` |