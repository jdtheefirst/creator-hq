"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/AuthContext";

export default function EditVideoClient({ video }: { video: any }) {
  const { user, supabase } = useAuth();
  const router = useRouter();
  const userId = user?.id;
  const videoId = video?.id;
  const mailtoLink = `mailto:jngatia045@gmail.com?subject=Feature%20Request&body=User%20ID:%20${userId}%0D%0AVideo%20ID:%20${videoId}%0D%0AFeature:%20Enable%20URL/source/thumbnail%20editing`;

  const [form, setForm] = useState({
    title: video.title,
    description: video.description,
    status: video.status,
    vip: video.vip,
    ads_enabled: video.ads_enabled,
    comments_enabled: video.comments_enabled,
    source: video.source,
  });

  const [saving, setSaving] = useState(false);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Edit Video</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feature Lock Notice */}
        <div className="mb-6 p-4 rounded-md border border-yellow-400 bg-yellow-100 text-yellow-800 text-sm">
          Updating the <strong>video source</strong>, <strong>URL</strong>, or{" "}
          <strong>thumbnail</strong> is not available in your current package.
          You can{" "}
          <span
            className="underline cursor-pointer text-blue-600"
            onClick={() => {
              toast("Opening mail...");
              window.location.href = `mailto:you@example.com?subject=Feature%20Request&body=Hey,%20please%20add%20video%20URL/source/thumbnail%20editing%20to%20my%20plan.%20Thanks!`;
            }}
          >
            ask to add this feature
          </span>
          .
        </div>

        {/* Video Metadata Preview */}
        <div className="grid gap-2 text-sm bg-gray-100 p-4 rounded-md border border-gray-300">
          <div>
            <span className="font-semibold text-gray-700">Video Source:</span>{" "}
            <span className="text-gray-900">{video.source}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Video URL:</span>{" "}
            <span className="text-gray-900 break-all">{video.url}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Thumbnail URL:</span>{" "}
            <span className="text-gray-900 break-all">
              {video.thumbnail_url}
            </span>
          </div>
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
