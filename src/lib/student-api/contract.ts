export interface GradeDto {
  id: number;
  name: string;
  level: string;
}

export interface StreamDto {
  id: number;
  name: string;
  slug: string;
}

export interface SubjectDto {
  id: number;
  name: string;
  slug: string;
  streams: StreamDto[];
  grades: GradeDto[];
}

export interface PublicTeacherDto {
  name: string;
  slug: string;
  description: string | null;
  img: string | null;
  subjects: SubjectDto[];
  grades: GradeDto[];
  has_library: boolean;
}

export interface PublicTeacherDetailDto extends Omit<
  PublicTeacherDto,
  "has_library"
> {
  location: string | null;
  experience: number | null;
  course_count: number;
}

export interface PublicItemDto {
  id: number;
  title: string;
  order: number;
  duration_minutes: number | null;
  has_video: boolean;
  has_document: boolean;
  has_exam: boolean;
  bunny_stream_embed_url: string | null;
  document_path: string | null;
  exam_id: number | null;
}

export interface PublicLessonDto {
  id: number;
  title: string;
  description: string | null;
  order: number;
  duration_minutes: number | null;
  items: PublicItemDto[];
}

export interface PublicChapterDto {
  id: number;
  title: string;
  order: number;
  lessons: PublicLessonDto[];
}

export interface PublicCourseDto {
  id: number;
  title: string;
  description: string | null;
  img: string | null;
  price: string | number;
  subject_name: string | null;
  grade_id: number;
  stream_id: number;
  total_duration_minutes: number | null;
  lesson_count: number;
  use_chapters: boolean;
  chapters: PublicChapterDto[];
  is_subscribed: boolean;
  created_at: string;
  teacher_name: string | null;
  teacher_slug: string | null;
}

export interface UserDto {
  id: number;
  email: string;
  name: string;
  phone_number: string | null;
  role: "STUDENT" | "TEACHER" | "ASSISTANT" | "ADMIN";
  is_active: boolean;
  created_at: string;
}

export interface EnrollmentDto {
  id: number;
  course_id: number;
  purchased_at: string;
  expires_at: string;
  course_price: string | number;
  total_paid: string | number;
  currency: string;
  payment_status: string;
  course: PublicCourseDto;
}

export interface MyCoursesDto {
  items: EnrollmentDto[];
}

export interface StudentCourseTeacherDto {
  name: string;
  slug: string;
  img: string | null;
}

export interface StudentCourseDetailDto {
  enrollment: EnrollmentDto | null;
  course: PublicCourseDto;
  teacher: StudentCourseTeacherDto | null;
}

export interface LoginDto {
  access_token: string;
  refresh_token: string;
  token_type: string;
  email: string;
  name: string;
}

export interface TokenDto {
  access_token: string;
  refresh_token: string;
}
