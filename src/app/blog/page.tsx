import Link from "next/link";
import { format } from "date-fns";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const supabase = await createClient();
  const { category } = searchParams;

  // Fetch blog posts
  let query = supabase
    .from("blogs")
    .select(
      "id, title, slug, excerpt, category, created_at, cover_image, ads_enabled"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (category && category !== "All") {
    query = query.eq("category", category);
  }

  const { data: posts, error } = await query;

  if (error) {
    console.error("Error fetching blog posts:", error);
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold text-center mb-12">Blog</h1>
          <p className="text-center text-red-600">
            Error loading blog posts. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Get unique categories
  const categories = [
    "All",
    ...new Set(posts?.map((post) => post.category) || []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12">Blog</h1>

        {/* Categories */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog${cat === "All" ? "" : `?category=${cat}`}`}
              className={`px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow ${
                (cat === "All" && !category) || cat === category
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts?.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {post.cover_image && (
                <div className="relative h-48 w-full">
                  <Image
                    src={post.cover_image}
                    alt={post.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-blue-600 font-medium">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(post.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <h2 className="text-xl font-semibold mb-2">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="hover:text-blue-600"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-blue-600 font-medium hover:text-blue-700"
                >
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Ad Space */}
        {posts?.some((post) => post.ads_enabled) && (
          <div className="mt-12 p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-gray-500">Advertisement Space</p>
          </div>
        )}
      </div>
    </div>
  );
}
