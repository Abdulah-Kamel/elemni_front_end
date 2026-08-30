import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Teacher } from "../../types";
import TeacherProfileView from "./teacher-profile-view";

vi.mock("@/src/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const teacher: Teacher = {
  id: "ahmad-ali",
  name: "أحمد علي",
  title: "مدرس رياضيات للمرحلة الثانوية",
  subject: "الرياضيات",
  subjects: ["الرياضيات", "تفاضل"],
  category: "math",
  grade: "3",
  gradeLabel: "الصف الثالث الثانوي",
  gradesList: ["الصف الثاني الثانوي", "الصف الثالث الثانوي"],
  gradeIds: ["2", "3"],
  streamIds: ["1"],
  avatar: "https://cdn.elemni.test/teacher.jpg",
  studentCount: 0,
  experienceYears: 12,
  pricePerSession: 250,
  bio: "أشرح المادة بطريقة عملية مع تدريبات متدرجة.",
  specialties: ["الرياضيات", "تفاضل"],
  schedule: [],
  location: "أونلاين",
  courses: [
    {
      id: "12",
      title: "كورس التفاضل",
      description: "شرح مبسط للتفاضل من البداية للنهاية.",
      price: 250,
      duration: "3 ساعات",
      sessionsCount: 12,
      image: "https://cdn.elemni.test/cover.jpg",
      isSubscribed: true,
      chapters: [
        {
          id: 1,
          title: "الوحدة الأولى",
          lessons: [
            {
              id: 11,
              title: "مقدمة في النهايات",
              description: "الأساسيات",
              durationMinutes: 20,
              items: [
                {
                  id: 101,
                  title: "فيديو الشرح",
                  hasVideo: true,
                  hasDocument: false,
                  hasExam: false,
                  videoUrl: "https://iframe.mediadelivery.net/play/123",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

describe("TeacherProfileView production experience", () => {
  it("expands a subscribed course without navigating away", () => {
    render(
      <TeacherProfileView
        teacher={teacher}
        onRequireAuth={() => undefined}
      />,
    );

    expect(screen.queryByText("مقدمة في النهايات")).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /عرض المحتوى|محتوى الكورس/ }),
    );

    expect(screen.getByText("مقدمة في النهايات")).toBeInTheDocument();
    expect(screen.getByText("فيديو الشرح")).toBeInTheDocument();
  });
});
