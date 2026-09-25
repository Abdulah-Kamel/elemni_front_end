import { backendErrorResponse, backendFetch } from "@/src/lib/student-api/backend";
import type {
  MyCoursesDto,
  PublicCourseDto,
  PublicTeacherDto,
  StudentCourseDetailDto,
} from "@/src/lib/student-api/contract";
import {
  authenticatedBackendFetch,
  getAccessToken,
} from "@/src/lib/student-api/session";

const discoveryCache = { next: { revalidate: 300 } } as const;

async function findCourseOwner(course: PublicCourseDto) {
  const query = new URLSearchParams({
    grade_id: String(course.grade_id),
    stream_id: String(course.stream_id),
  });
  const teachers = await backendFetch<PublicTeacherDto[]>(
    `/api/v1/teachers?${query}`,
    discoveryCache,
  );
  if (!teachers.ok) return null;

  // Keep discovery pressure bounded when several teachers share a grade and stream.
  for (let index = 0; index < teachers.data.length; index += 4) {
    const batch = teachers.data.slice(index, index + 4);
    const matches = await Promise.all(
      batch.map(async (teacher) => {
        const path = `/api/v1/teachers/${encodeURIComponent(teacher.slug)}/courses/${course.id}`;
        const result = await backendFetch<PublicCourseDto>(path, discoveryCache);
        return result.ok ? { teacher, path, publicCourse: result.data } : null;
      }),
    );
    const match = matches.find((item) => item !== null);
    if (match) return match;
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId: rawCourseId } = await params;
  const courseId = Number(rawCourseId);
  if (!Number.isInteger(courseId) || courseId <= 0) {
    return Response.json({ detail: "معرّف الكورس غير صالح." }, { status: 400 });
  }

  const accessToken = await getAccessToken();
  let enrollment: MyCoursesDto["items"][number] | undefined;
  if (accessToken) {
    const courses = await authenticatedBackendFetch<MyCoursesDto>("/api/v1/my/courses", {
      cache: "no-store",
    });
    if (!courses.ok) return backendErrorResponse(courses.error);
    enrollment = courses.data.items.find((item) => item.course_id === courseId);
  }

  if (!enrollment) {
    const teacherSlug = new URL(request.url).searchParams.get("teacher")?.trim();
    if (!teacherSlug) {
      return Response.json({ detail: "تعذر تحديد مدرس هذا الكورس." }, { status: 404 });
    }

    const [courseResult, teachersResult] = await Promise.all([
      backendFetch<PublicCourseDto>(
        `/api/v1/teachers/${encodeURIComponent(teacherSlug)}/courses/${courseId}`,
        discoveryCache,
      ),
      backendFetch<PublicTeacherDto[]>("/api/v1/teachers", discoveryCache),
    ]);
    if (!courseResult.ok) return backendErrorResponse(courseResult.error);

    const teacher = teachersResult.ok
      ? teachersResult.data.find((item) => item.slug === teacherSlug)
      : null;
    const response: StudentCourseDetailDto = {
      enrollment: null,
      course: courseResult.data,
      teacher: teacher
        ? { name: teacher.name, slug: teacher.slug, img: teacher.img }
        : null,
    };
    return Response.json(response);
  }

  const owner = await findCourseOwner(enrollment.course);
  let detailedCourse = enrollment.course;
  if (owner) {
    const subscribedDetail = await authenticatedBackendFetch<PublicCourseDto>(owner.path, {
      cache: "no-store",
    });
    detailedCourse = subscribedDetail.ok ? subscribedDetail.data : owner.publicCourse;
  }

  const response: StudentCourseDetailDto = {
    enrollment: { ...enrollment, course: detailedCourse },
    course: detailedCourse,
    teacher: owner
      ? { name: owner.teacher.name, slug: owner.teacher.slug, img: owner.teacher.img }
      : null,
  };
  return Response.json(response);
}
