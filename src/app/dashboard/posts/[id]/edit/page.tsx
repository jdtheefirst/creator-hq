import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PostEditor from "@/components/PostEditor";

interface EditPostPageProps {
  params: {
    id: string;
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !post) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Edit Post</h1>
        <PostEditor post={post} />
      </div>
    </div>
  );
}
