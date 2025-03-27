import PostEditor from "@/components/PostEditor";

export default async function NewPostPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">New Post</h1>
        <PostEditor post={null} />
      </div>
    </div>
  );
}
