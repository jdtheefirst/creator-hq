import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Course not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative w-full h-64 mb-8 rounded-xl overflow-hidden shadow-md">
          <Image
            src={course.cover_image_url || "/placeholder.jpg"}
            alt={course.title}
            fill
            className="object-cover"
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
        </div>
        <p className="text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
          {course.description}
        </p>

        <div className="mt-12">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition">
            {course.price === 0
              ? "Enroll for Free"
              : `Enroll for $${course.price}`}
          </button>
        </div>
      </div>
    </div>
  );
}
