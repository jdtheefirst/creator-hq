import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function CourseSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const { courseId } = await searchParams;

  if (!courseId) {
    return (
      <div className="p-8 text-red-600">
        <h1 className="text-2xl font-bold text-red-700 mb-2">
          Invalid success URL: Missing course ID
        </h1>
        <Link
          href="/courses"
          className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Return to Courses
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-green-50 px-4">
      <div className="max-w-md text-center bg-white p-6 rounded-2xl shadow-md">
        <div className="flex justify-center mb-6">
          <div className="animate-bounce-slow">
            <CheckCircle className="w-16 h-16 text-green-500 animate-pop" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-green-700 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-700 mb-4">
          You’re now enrolled in course <strong>{courseId}</strong>.
        </p>
        <Link
          href={`/courses/${courseId}`}
          className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          Go to Course
        </Link>
      </div>
    </main>
  );
}
