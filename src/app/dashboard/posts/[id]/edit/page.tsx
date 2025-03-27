import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import PostEditor from "@/components/PostEditor";

interface EditPostPageProps {
  params: {
    id: string;
  };
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const supabase = createServerComponentClient({ cookies });
  const isNewPost = params.id === "new";

  let post = null;
  if (!isNewPost) {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      console.error("Error fetching post:", error);
      notFound();
    }

    post = data;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">
          {isNewPost ? "New Post" : "Edit Post"}
        </h1>
        <PostEditor post={post} />
      </div>
    </div>
  );
}
