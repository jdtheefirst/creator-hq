import CourseForm from "@/components/CourseForm";

export default function NewCoursePage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Course</h1>
      <CourseForm mode="new" />
    </div>
  );
}
