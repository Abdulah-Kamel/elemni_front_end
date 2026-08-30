export type StudentSessionChange = "login" | "logout";

export function notifyStudentSessionChanged(change: StudentSessionChange) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<StudentSessionChange>("student-session-changed", {
      detail: change,
    }),
  );
}
