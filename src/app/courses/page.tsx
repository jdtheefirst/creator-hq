import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, price, level, duration, cover_image_url")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">
          Explore Courses
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses?.map((course) => (
            <Link key={course.id} href={`/app/courses/${course.id}`}>
              <div className="group bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="relative w-full h-48">
                  <Image
                    src={course.cover_image_url || "/placeholder.jpg"}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <h2 className="text-lg font-semibold group-hover:text-blue-600 transition">
                    {course.title}
                  </h2>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{course.level}</span>
                    <span>{course.duration}</span>
                  </div>
                  <div className="text-right font-bold text-blue-600">
                    {course.price === 0 ? "Free" : `$${course.price}`}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
