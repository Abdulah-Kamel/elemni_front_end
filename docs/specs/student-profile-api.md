# Student study profile — backend work needed

Onboarding asks a new student for their **grade**, **stream** and **subjects**.
The dashboard, explore page and recommendations use these answers.

Today there is nowhere to save them: `GET /api/v1/auth/me` doesn't return
them, there is no endpoint to update them, and chosen subjects have no table.
The frontend already calls the endpoint below through its BFF route
(`PUT /api/student/profile`). While the backend answers 404/405/501 it keeps
the answers in the browser (`localStorage`), so they are lost on another
device or after clearing site data.

## Why this belongs in the backend
- The profile must follow the student across devices and browsers.
- Recommendations, teacher discovery and notifications should be computed
  server-side from the same data.
- Admins already see `grade_id` / `stream_id` on students (`AdminStudentOut`);
  onboarding should fill the same fields instead of a separate browser copy.
- The app can decide whether to show onboarding from the server
  (`onboarding_completed`) instead of guessing per browser.

## Endpoints

### `PUT /api/v1/students/me/profile` (authenticated student)
Request:
```json
{ "grade_id": 10, "stream_id": 1, "subject_ids": [100, 101] }
```
- Validate the ids exist, the stream belongs to the grade's streams, and each
  subject is offered for that grade (and ideally stream). 422 with a `detail`
  message otherwise.
- Store `grade_id` / `stream_id` on `student_profiles`; store subjects in a new
  `student_profile_subjects (student_profile_id, subject_id)` table.
- Set `onboarding_completed_at` the first time.
- Response: the profile object below.

### `GET /api/v1/auth/me` (extend)
Add for students:
```json
"student_profile": {
  "grade_id": 10, "grade_name": "Grade 10",
  "stream_id": 1, "stream_name": "Science",
  "subject_ids": [100, 101],
  "onboarding_completed": true
}
```
The frontend will then send new students to onboarding only when
`onboarding_completed` is false, prefill the answers from the server, and drop
the local fallback.

## Optional
`GET /api/v1/subjects?grade_id=&stream_id=` so onboarding doesn't need the full
subject catalogue with nested grades/streams.
