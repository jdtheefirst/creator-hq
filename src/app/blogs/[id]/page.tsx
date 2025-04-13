import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import Image from "next/image";
import { notFound } from "next/navigation";

interface BlogPostPageProps {
  params: {
    id: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch published post by slug
  const { data: post } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .single();

  if (!post) {
    console.error("Error fetching blog post");
    notFound();
  }

  return (
    <article className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-blue-600 font-medium">
              {post.category}
            </span>
            <span className="text-sm text-gray-500">
              {format(new Date(post.created_at), "MMM d, yyyy")}
            </span>
          </div>
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Straight from the Creator’s mind</span>
          </div>
        </header>

        {/* Cover Image */}
        {post.cover_image && (
          <div className="relative h-[400px] w-full mb-8 rounded-lg overflow-hidden">
            <Image
              src={post.cover_image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Ad Space */}
        {post.ads_enabled && (
          <div className="my-8 p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-gray-500">Advertisement Space</p>
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Bottom Ad Space */}
        {post.ads_enabled && (
          <div className="mt-12 p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-gray-500">Advertisement Space</p>
          </div>
        )}
      </div>
    </article>
  );
}
