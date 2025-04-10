// src/components/BlogForm.tsx
"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Import Editor dynamically to avoid SSR issues
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().min(1, "Category is required"),
  cover_image: z.string().optional(),
  status: z.enum(["draft", "published"]),
  vip: z.boolean().optional(),
  ads_enabled: z.boolean().optional(),
  comments_enabled: z.boolean().optional(),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

export default function BlogForm({
  mode,
  initialData,
  postId,
}: {
  mode: "new" | "edit";
  initialData?: Partial<BlogPostFormData>;
  postId?: string;
}) {
  const { user, supabase } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: initialData,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/blog-covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const onSubmit = async (data: BlogPostFormData) => {
    setIsSubmitting(true);

    try {
      let coverImageUrl = data.cover_image;

      if (coverImage) {
        coverImageUrl = (await handleImageUpload(coverImage)) || undefined;
        if (!coverImageUrl) throw new Error("Failed to upload cover image");
      }

      if (mode === "new") {
        const { error } = await supabase.from("blogs").insert({
          ...data,
          creator_id: user?.id,
          cover_image: coverImageUrl,
        });

        if (error) throw error;

        toast.success("Blog post created successfully");
      } else {
        const { error } = await supabase
          .from("blogs")
          .update({
            ...data,
            cover_image: coverImageUrl,
          })
          .eq("id", postId);

        if (error) throw error;

        toast.success("Blog post updated successfully");
      }

      router.push("/dashboard/posts");
    } catch (error) {
      console.error("Error creating/updating post:", error);
      toast.error("Failed to create/update blog post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            {...register("title")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
          {errors.title && (
            <p className="text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Excerpt
          </label>
          <textarea
            {...register("excerpt")}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.excerpt && (
            <p className="text-red-600">{errors.excerpt.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            {...register("category")}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {[
              "Technology",
              "Lifestyle",
              "Travel",
              "Food",
              "Health",
              "Business",
              "Other",
            ].map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Cover Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            className="mt-1 block w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Content
          </label>
          <Controller
            name="content"
            control={control} // Use control from useForm
            defaultValue={initialData?.content || ""}
            render={({ field }) => (
              <Editor
                value={field.value}
                onChange={(content) => field.onChange(content)} // Update form state
              />
            )}
          />
          {errors.content && (
            <p className="text-red-600">{errors.content.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <label className="text-sm text-gray-700">
            <input
              type="checkbox"
              {...register("vip")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">VIP Course</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register("ads_enabled")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Enable Ads</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              {...register("comments_enabled")}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-600">Enable Comments</span>
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => setValue("status", "draft")}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {isSubmitting ? "Publishing..." : "Publish"}
          </button>
        </div>
      </form>
    </div>
  );
}
