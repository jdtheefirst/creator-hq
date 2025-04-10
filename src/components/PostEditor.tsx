"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useAuth } from "@/lib/context/AuthContext";

// Dynamically import the rich text editor to avoid SSR issues
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

interface Post {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  cover_image: string | null;
  ads_enabled: boolean;
  status: "draft" | "published";
  comments_enabled: boolean;
}

interface PostEditorProps {
  post: Post | null;
}

export default function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const { supabase } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Post>(
    post || {
      title: "",
      excerpt: "",
      content: "",
      category: "",
      cover_image: null,
      ads_enabled: false,
      status: "draft",
      comments_enabled: true,
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const postData = {
        ...formData,
        author_id: user.id,
      };

      if (post?.id) {
        // Update existing post
        const { error } = await supabase
          .from("blogs")
          .update(postData)
          .eq("id", post.id);

        if (error) throw error;
      } else {
        // Create new post
        const { error } = await supabase.from("blogs").insert([postData]);
        if (error) throw error;
      }

      router.push("/dashboard/posts");
      router.refresh();
    } catch (error) {
      console.error("Error saving post:", error);
      alert("Error saving post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, cover_image: publicUrl }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Error uploading image. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700"
        >
          Category
        </label>
        <input
          type="text"
          id="category"
          value={formData.category}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, category: e.target.value }))
          }
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      {/* Excerpt */}
      <div>
        <label
          htmlFor="excerpt"
          className="block text-sm font-medium text-gray-700"
        >
          Excerpt
        </label>
        <textarea
          id="excerpt"
          value={formData.excerpt}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, excerpt: e.target.value }))
          }
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Cover Image */}
      <div>
        <label
          htmlFor="cover_image"
          className="block text-sm font-medium text-gray-700"
        >
          Cover Image
        </label>
        {formData.cover_image && (
          <div className="mt-2 relative h-48 w-full">
            <Image
              src={formData.cover_image}
              alt="Cover"
              fill
              className="object-cover rounded-lg"
            />
          </div>
        )}
        <input
          type="file"
          id="cover_image"
          accept="image/*"
          onChange={handleImageUpload}
          className="mt-2 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {/* Content */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium text-gray-700"
        >
          Content
        </label>
        <div className="mt-1">
          <Editor
            value={formData.content}
            onChange={(content) =>
              setFormData((prev) => ({ ...prev, content }))
            }
          />
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                status: e.target.value as "draft" | "published",
              }))
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Settings
          </label>
          <div className="mt-2 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.ads_enabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ads_enabled: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Enable Ads</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.comments_enabled}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    comments_enabled: e.target.checked,
                  }))
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Enable Comments
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard/posts")}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Post"}
        </button>
      </div>
    </form>
  );
}
