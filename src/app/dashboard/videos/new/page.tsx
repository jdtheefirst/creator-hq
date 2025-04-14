"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import VideoUploader from "@/components/VideoUploader";
import VideoPlayer from "@/components/VideoPlayer";

interface VideoForm {
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  source: "youtube" | "upload" | "vimeo" | "twitch" | "facebook" | "custom";
  video_id?: string;
  status: "draft" | "published";
  comments_enabled?: boolean;
  ads_enabled?: boolean;
  vip?: boolean;
}

export default function NewVideoPage() {
  const { user, supabase } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<VideoForm>({
    title: "",
    description: "",
    url: "",
    thumbnail_url: "",
    source: "upload",
    status: "published",
    video_id: "",
    comments_enabled: true,
    ads_enabled: true,
    vip: false,
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
          <VideoUploader
            onUploadComplete={(url, thumbnailUrl) => {
              setForm((prev) => ({
                ...prev,
                url,
                thumbnail_url: thumbnailUrl,
                source: "upload",
              }));
            }}
            onYouTubeAdd={(videoId, thumbnailUrl, source) => {
              setForm((prev) => ({
                ...prev,
                video_id: videoId,
                thumbnail_url: thumbnailUrl,
                url: videoId,
                source: source as
                  | "youtube"
                  | "upload"
                  | "vimeo"
                  | "twitch"
                  | "facebook"
                  | "custom",
              }));
            }}
          />
          <span className="text-sm text-gray-500">
            Source: {form.source} Video ID: {form.video_id} Video Url:{" "}
            {form.url} Thumbnail: {form.thumbnail_url}
          </span>
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

        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.vip}
              onChange={(e) =>
                setForm({
                  ...form,
                  vip: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">VIP Course</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.ads_enabled}
              onChange={(e) =>
                setForm({
                  ...form,
                  ads_enabled: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Enable Ads</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.comments_enabled}
              onChange={(e) =>
                setForm({
                  ...form,
                  comments_enabled: e.target.checked,
                })
              }
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Enable Comments</span>
          </label>
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
            <VideoPlayer
              url={form.url}
              source={form.source}
              videoId={form.video_id}
              thumbnailUrl={form.thumbnail_url}
            />
          </div>
        </div>
      )}
    </div>
  );
}
