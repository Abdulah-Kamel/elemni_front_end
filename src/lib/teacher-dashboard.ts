export function getTeacherDashboardSignInUrl(locale: string) {
  const origin = process.env.NEXT_PUBLIC_TEACHER_DASHBOARD_URL ?? "https://elemni-dashboard.vercel.app";
  return `${origin.replace(/\/+$/, "")}/${locale}/sign-in`;
}
