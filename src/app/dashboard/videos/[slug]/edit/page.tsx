"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface VideoForm {
  title: string;
  description: string;
  status: "draft" | "published";
}

export default function EditVideoPage({
  params,
}: {
  params: { slug: string };
}) {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [video, setVideo] = useState<any>(null);
  const [form, setForm] = useState<VideoForm>({
    title: "",
    description: "",
    status: "draft",
  });

  useEffect(() => {
    fetchVideo();
  }, [params.slug]);

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("slug", params.slug)
        .single();

      if (error) throw error;

      setVideo(data);
      setForm({
        title: data.title,
        description: data.description,
        status: data.status,
      });
    } catch (error) {
      console.error("Error fetching video:", error);
      toast.error("Failed to fetch video");
      router.push("/dashboard/videos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from("videos")
        .update(form)
        .eq("id", video.id)
        .eq("creator_id", user?.id);

      if (error) throw error;

      toast.success("Video updated successfully");
      router.push("/dashboard/videos");
    } catch (error) {
      console.error("Error updating video:", error);
      toast.error("Failed to update video");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Edit Video</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Preview */}
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          {video.source === "youtube" ? (
            <iframe
              src={`https://www.youtube.com/embed/${video.video_id}`}
              className="w-full h-full"
              allowFullScreen
            />
          ) : (
            <video
              src={video.url}
              controls
              className="w-full h-full"
              poster={video.thumbnail_url}
            />
          )}
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
            disabled={saving}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
