import BlogForm from "@/components/BlogForm";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface EditBlogPostProps {
  params: {
    id: string;
  };
}

export default async function EditBlogPost({ params }: EditBlogPostProps) {
  const supabase = await createClient();
  const { id } = await params;

  let initialData = null;

  try {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    initialData = data;

    if (!initialData) {
      throw new Error("Blog post not found");
    }
  } catch (error) {
    console.error("Error fetching blog post data:", error);
    initialData = null; // Set to null if there's an error or no data found
  }

  if (!initialData) {
    notFound(); // Redirect to 404 if the post is not found
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Blog Post</h1>
      {initialData && (
        <BlogForm mode="edit" initialData={initialData} postId={id} />
      )}
    </div>
  );
}
