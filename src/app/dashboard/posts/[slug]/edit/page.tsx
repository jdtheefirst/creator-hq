import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PostEditor from "@/components/PostEditor";

interface PostEditPageProps {
  params: {
    slug: string;
  };
}

export default async function PostEditPage({ params }: PostEditPageProps) {
  const supabase = await createClient();

  // Fetch post by slug
  const { data: post, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !post) {
    notFound();
  }
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Edit Post</h1>
      <PostEditor post={post} />
    </div>
  );
}
