import BlogForm from "@/components/BlogForm";

export default function NewBlogPost() {
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Blog Post</h1>
      <BlogForm mode="new" />
    </div>
  );
}
