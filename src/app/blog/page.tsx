import Link from "next/link";
import { format } from "date-fns";

// Temporary blog post data
const posts = [
  {
    id: 1,
    title: "Getting Started with Digital Art",
    excerpt:
      "Learn the basics of digital art creation and tools you need to get started.",
    date: "2024-03-15",
    category: "Tutorial",
    slug: "getting-started-with-digital-art",
  },
  {
    id: 2,
    title: "Behind the Scenes: My Creative Process",
    excerpt:
      "A peek into how I approach creating new content and managing my creative workflow.",
    date: "2024-03-10",
    category: "Process",
    slug: "behind-the-scenes-creative-process",
  },
  {
    id: 3,
    title: "Top 10 Tools for Content Creators",
    excerpt:
      "Essential tools and software that every content creator should know about.",
    date: "2024-03-05",
    category: "Resources",
    slug: "top-10-tools-content-creators",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12">Blog</h1>

        {/* Categories */}
        <div className="flex justify-center gap-4 mb-8">
          {["All", "Tutorial", "Process", "Resources"].map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-blue-600 font-medium">
                    {post.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(new Date(post.date), "MMM d, yyyy")}
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
      </div>
    </div>
  );
}
