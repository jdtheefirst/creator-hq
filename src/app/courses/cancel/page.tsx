import { X } from "lucide-react";

export default async function CourseCancelPage({
  searchParams,
}: {
  searchParams: { courseId?: string };
}) {
  const { courseId } = await searchParams;
  //

  if (!courseId) {
    return (
      <div className="p-8 text-red-600">
        <h1 className="text-2xl font-bold text-red-700 mb-2">
          Invalid cancel URL: Missing course ID
        </h1>
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
    <main className="min-h-screen flex items-center justify-center bg-red-50 px-4">
      <div className="max-w-md text-center bg-white p-6 rounded-2xl shadow-md">
        <div className="flex justify-center mb-6">
          <div className="animate-bounce-slow">
            <X className="w-16 h-16 text-green-500 animate-pop" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-red-700 mb-2">
          Payment Cancelled!
        </h1>
        <p className="text-gray-700 mb-4">
          You cancelled the payment for{" "}
          {courseId ? <strong>course {courseId}</strong> : "this course"}. You
          can try again anytime.
        </p>
        <a
          href="/courses"
          className="inline-block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Return to Courses
        </a>
      </div>
    </main>
  );
}
