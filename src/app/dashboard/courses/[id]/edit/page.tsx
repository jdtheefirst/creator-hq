import CourseForm from "@/components/CourseForm";
import { createClient } from "@/lib/supabase/server";
import { th } from "date-fns/locale";

interface EditCourseProps {
  params: {
    id: string;
  };
}

export default async function EditCoursePage({ params }: EditCourseProps) {
  const supabase = await createClient();

  let initialData = null;

  try {
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) throw error;

    initialData = data;

    if (!initialData) {
      throw new Error("Course not found");
    }
  } catch (error) {
    console.error("Error fetching course data:", error);
    initialData = null; // Set to null if there's an error or no data found
  }

  if (!initialData) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Course</h1>
        <p className="text-red-500">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Course</h1>
      {initialData && <CourseForm mode="edit" initialData={initialData} />}
    </div>
  );
}
