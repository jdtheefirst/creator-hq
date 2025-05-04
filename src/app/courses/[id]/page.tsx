import { CourseMediaToggle } from "@/components/ui/mediaToggle";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const supabase = await createClient();
  const creatorId = process.env.NEXT_PUBLIC_CREATOR_UID;

  const { data: user } = await supabase.auth.getUser();
  const userId = user?.user?.id;

  const { data: course, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .eq("creator_id", creatorId)
    .single();

  const isEnrolled = course?.students?.includes(userId);

  if (!course || error) {
    console.error("Error fetching course data:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Course not found</p>
        <a
          href="/courses"
          className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Return to Courses
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative w-full h-auto mb-8">
          <CourseMediaToggle
            coverUrl={course.cover_image_url}
            title={course.title}
            videoUrl={course.video_url}
            audioUrl={course.audio_url}
            content={course.content}
            courseType={course.course_type}
            isEnrolled={isEnrolled}
          />
        </div>
        <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
          <span className="bg-gray-100 px-3 py-1 rounded-full">
            Level: {course.level}
          </span>
          <span className="bg-gray-100 px-3 py-1 rounded-full">
            Duration: {course.duration}
          </span>
          <span className="bg-gray-100 px-3 py-1 rounded-full">
            {course.price === 0 ? "Free" : `$${course.price}`}
          </span>
          {course.vip && (
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
              VIP Exclusive
            </span>
          )}
          {course.tags?.map((tag: string) => (
            <span
              key={tag}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
          {course.description}
        </p>

        <div className="mt-12 flex items-center justify-between gap-4">
          {!isEnrolled && (
            <Link
              href={`/checkout/course?courseId=${course.id}&type=${
                course.price === 0 ? "free" : "pay"
              }`}
              className="inline-block"
            >
              <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition">
                {course.price === 0
                  ? "Enroll for Free"
                  : `Enroll for $${course.price}`}
              </button>
            </Link>
          )}
          <a href="/courses" className="text-gray-600 hover:underline">
            Back to Courses
          </a>
        </div>
      </div>
    </div>
  );
}
