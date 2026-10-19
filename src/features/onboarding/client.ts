// Saves the student's study profile (grade, stream, subjects) and phone number.
// The backend owns them (GET/PUT /api/v1/students/me/profile through
// /api/student/profile). A copy stays on this device only when the network or
// the server failed; it belongs to one student, never holds the phone number,
// and is uploaded once that student's backend profile turns out to be empty.
import type { StudentProfileDto } from "@/src/lib/student-api/contract";
import { StudentApiError, studentApiFetch } from "@/src/lib/student-api/client";

export interface StudentOnboardingPayload {
  grade_id: number;
  stream_id: number;
  subject_ids: number[];
  phone_number?: string;
}

/** The part of the profile a device draft may hold. */
export type StudyDraft = Omit<StudentOnboardingPayload, "phone_number">;

type StoredDraft = StudyDraft & { version: 1; owner_id: number; completed_at?: string };

export const ONBOARDING_DRAFT_KEY = "elemni-student-onboarding-v1";

/** Same rule as the backend: digits, spaces or +, 10 to 20 characters. */
export const PHONE_PATTERN = /^[0-9+ ]{10,20}$/;

export function saveStudentProfile(patch: Partial<StudentProfileDto>): Promise<StudentProfileDto> {
  return studentApiFetch<StudentProfileDto>("/api/student/profile", {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function clearOnboardingDraft() {
  try {
    localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  } catch {
    /* Storage may be disabled. */
  }
}

function writeDraft(ownerId: number, study: StudyDraft, completedAt = new Date().toISOString()) {
  try {
    const draft: StoredDraft = {
      version: 1,
      owner_id: ownerId,
      grade_id: study.grade_id,
      stream_id: study.stream_id,
      subject_ids: study.subject_ids,
      completed_at: completedAt,
    };
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* Private mode or full storage: onboarding still finishes. */
  }
}

/** The device copy of this student's choices, or null (another student's, malformed or none). */
export function readOnboardingDraft(ownerId: number | undefined): StudyDraft | null {
  if (ownerId == null) return null;
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (
      !draft || !Number.isInteger(draft.grade_id) || !Number.isInteger(draft.stream_id) ||
      !Array.isArray(draft.subject_ids) || !draft.subject_ids.every(Number.isInteger) ||
      (draft.owner_id !== undefined && draft.owner_id !== ownerId)
    ) return null;
    const study: StudyDraft = { grade_id: draft.grade_id, stream_id: draft.stream_id, subject_ids: draft.subject_ids };
    // Drafts saved before they carried an owner are claimed once, dropping any stored phone.
    if (draft.owner_id === undefined || "phone_number" in draft) {
      writeDraft(ownerId, study, typeof draft.completed_at === "string" ? draft.completed_at : undefined);
    }
    return study;
  } catch {
    return null;
  }
}

/**
 * Saves onboarding on the backend. Errors are rethrown so the flow can offer a retry;
 * when the network or the server failed, the study choices (never the phone) are also
 * kept on this device for this student so they can be uploaded later.
 */
export async function saveStudentOnboarding(payload: StudentOnboardingPayload, ownerId: number | undefined): Promise<StudentProfileDto> {
  try {
    const profile = await saveStudentProfile(payload);
    clearOnboardingDraft();
    return profile;
  } catch (error) {
    const rejected = error instanceof StudentApiError && error.status >= 400 && error.status < 500;
    if (!rejected && ownerId != null) {
      writeDraft(ownerId, { grade_id: payload.grade_id, stream_id: payload.stream_id, subject_ids: payload.subject_ids });
    }
    throw error;
  }
}

/** Uploads this student's device draft when the backend profile has no grade yet. */
export async function uploadDraftIfProfileEmpty(profile: StudentProfileDto, ownerId: number | undefined): Promise<StudentProfileDto> {
  if (profile.grade_id != null) return profile;
  const draft = readOnboardingDraft(ownerId);
  if (!draft) return profile;
  const updated = await saveStudentProfile(draft);
  clearOnboardingDraft();
  return updated;
}
