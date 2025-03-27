import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { format } from "date-fns";
import Image from "next/image";
import { notFound } from "next/navigation";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  category: string;
  cover_image: string | null;
  ads_enabled: boolean;
  author: {
    email: string;
  } | null;
}

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const supabase = createServerComponentClient({ cookies });

  // Fetch blog post
  const { data: post, error } = await supabase
    .from("blogs")
    .select(
      `
      id,
      title,
      content,
      created_at,
      category,
      cover_image,
      ads_enabled,
      author:author_id (
        email
      )
    `
    )
    .eq("slug", params.slug)
    .eq("status", "published")
    .single();

  if (error || !post) {
    console.error("Error fetching blog post:", error);
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
            <span>By {post.author?.email || "Anonymous"}</span>
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
        <div className="prose prose-lg max-w-none">{post.content}</div>

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
