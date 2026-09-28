// Saves the student's study profile (grade, stream, subjects).
// The backend should own this (see docs/specs/student-profile-api.md); until
// PUT /api/v1/students/me/profile exists the choices are kept on this device
// so the dashboard and explore pages can still personalise.
export interface StudentOnboardingPayload {
  grade_id: number;
  stream_id: number;
  subject_ids: number[];
}

export type OnboardingDraft = StudentOnboardingPayload & { version: 1; completed_at: string };

export const ONBOARDING_DRAFT_KEY = "elemni-student-onboarding-v1";

export type SaveOutcome = "saved" | "saved_locally";

export class OnboardingSaveError extends Error {}

function writeDraft(payload: StudentOnboardingPayload) {
  try {
    const draft: OnboardingDraft = { version: 1, ...payload, completed_at: new Date().toISOString() };
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Private mode or full storage: the server copy (if any) still holds it. */
  }
}

export function readOnboardingDraft(): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as OnboardingDraft;
    return Number.isInteger(draft.grade_id) && Number.isInteger(draft.stream_id) && Array.isArray(draft.subject_ids) ? draft : null;
  } catch {
    return null;
  }
}

export async function saveStudentOnboarding(payload: StudentOnboardingPayload): Promise<SaveOutcome> {
  let response: Response;
  try {
    response = await fetch("/api/student/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new OnboardingSaveError("network");
  }
  // The endpoint isn't deployed yet: keep the choices on this device.
  if (response.status === 404 || response.status === 405 || response.status === 501) {
    writeDraft(payload);
    return "saved_locally";
  }
  if (!response.ok) throw new OnboardingSaveError(String(response.status));
  writeDraft(payload);
  return "saved";
}
