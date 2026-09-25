"use client";

import type { Teacher } from "../../types";
import StudentPortalShell from "@/src/features/portal/components/portal-shell";
import type { UserDto } from "@/src/lib/student-api/contract";
import { useRouter } from "@/src/i18n/navigation";
import TeacherProfileView from "./teacher-profile-view";

export default function DashboardTeacherProfile({ teacher, user }: { teacher: Teacher; user: UserDto }) {
  const router = useRouter();

  return (
    <StudentPortalShell user={user} active="teachers" title={teacher.name}>
      <TeacherProfileView
        key={teacher.courses.map((course) => `${course.id}:${course.isSubscribed}`).join("|")}
        teacher={teacher}
        teacherListHref="/explore/teachers"
        onRequireAuth={() => router.replace("/login")}
      />
    </StudentPortalShell>
  );
}
