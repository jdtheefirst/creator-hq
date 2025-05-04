import CourseForm from "@/components/CourseForm";

export default function NewCoursePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Course Studio</h1>
        <CourseForm mode="new" />
      </div>
    </div>
  );
}
