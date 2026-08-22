export interface StudentOnboardingPayload {
  grade_id: number;
  stream_id: number;
  subject_ids: number[];
}

const ONBOARDING_DRAFT_KEY = "elemni-student-onboarding-v1";

export async function saveStudentOnboarding(payload: StudentOnboardingPayload) {
  localStorage.setItem(
    ONBOARDING_DRAFT_KEY,
    JSON.stringify({ version: 1, ...payload, completed_at: new Date().toISOString() }),
  );
}
