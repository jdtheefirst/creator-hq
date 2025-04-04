"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import VideoUploader from "@/components/VideoUploader";

interface VideoForm {
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  source: "youtube" | "upload";
  video_id?: string;
  status: "draft" | "published";
}

export default function NewVideoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<VideoForm>({
    title: "",
    description: "",
    url: "",
    thumbnail_url: "",
    source: "upload",
    status: "draft",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("videos").insert([
        {
          ...form,
          creator_id: user?.id,
        },
      ]);

      if (error) throw error;

      toast.success("Video created successfully");
      router.push("/dashboard/videos");
    } catch (error) {
      console.error("Error creating video:", error);
      toast.error("Failed to create video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">New Video</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Video Uploader */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Video
          </label>
          <VideoUploader
            onUploadComplete={(url, thumbnailUrl) => {
              setForm((prev) => ({
                ...prev,
                url,
                thumbnail_url: thumbnailUrl,
                source: "upload",
              }));
            }}
            onYouTubeAdd={(videoId, thumbnailUrl) => {
              setForm((prev) => ({
                ...prev,
                video_id: videoId,
                thumbnail_url: thumbnailUrl,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                source: "youtube",
              }));
            }}
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as "draft" | "published",
              })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !form.url}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Video"}
          </button>
        </div>
      </form>

      {/* Preview */}
      {form.url && (
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">Preview</h2>
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            {form.source === "youtube" ? (
              <iframe
                src={`https://www.youtube.com/embed/${form.video_id}`}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video
                src={form.url}
                controls
                className="w-full h-full"
                poster={form.thumbnail_url}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
