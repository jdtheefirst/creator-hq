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
import axios from "axios";

// Import Editor dynamically to avoid SSR issues
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

const blogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  content: z.string().min(1, "Content is required"),
  category: z.string().min(1, "Category is required"),
  cover_image: z.string().optional(),
  status: z.enum(["draft", "published"], {
    errorMap: () => ({ message: "Status is required" }),
  }),
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
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: { ...initialData, status: initialData?.status || "draft" },
    mode: "onBlur",
  });

  const { supabase, user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const handleImageUpload = async (file: File) => {
    try {
      if (!file) throw new Error("No file selected");

      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user?.id}/blog-covers/${fileName}`;

      const { data, error } = await supabase.storage
        .from("blog-images")
        .createSignedUploadUrl(filePath);

      if (error) throw error;

      await axios.put(data.signedUrl, file, {
        headers: { "Content-Type": file.type },
      });

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
      let coverImageUrl = initialData?.cover_image || undefined;

      if (coverImage) {
        // 1. Delete the old image if it exists

        if (coverImageUrl) {
          try {
            const pathStart =
              coverImageUrl.indexOf("/storage/v1/object/public/blog-images/") +
              "/storage/v1/object/public/blog-images/".length;
            const filePath = coverImageUrl.substring(pathStart);

            const { error: deleteError } = await supabase.storage
              .from("blog-images")
              .remove([filePath]);

            if (deleteError) {
              toast.error("Failed to delete old image");
            } else {
              toast.success("Old image deleted successfully");
            }
          } catch (deleteErr) {
            console.error(
              "Error extracting file path for deletion:",
              deleteErr
            );
          }
        }

        console.log("Uploading new image:", coverImage.name);
        // 2. Upload new image
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
    <div className="max-w-4xl mx-auto py-8">
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
            <p className="text-red-600 text-xs">{errors.title.message}</p>
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
            <p className="text-red-600 text-xs">{errors.excerpt.message}</p>
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
          {errors.category && (
            <p className="text-red-600 text-xs">{errors.category.message}</p>
          )}
        </div>

        <div className="mb-4">
          {initialData?.cover_image && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-1">Current Cover Image:</p>
              <img
                src={initialData?.cover_image}
                alt="Current cover"
                className="w-full max-w-xs rounded-lg border shadow"
              />
            </div>
          )}
          {coverImage && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-1">Select Image:</p>
              <img
                src={coverImage ? URL.createObjectURL(coverImage) : undefined}
                alt="Current cover"
                className="w-full max-w-xs rounded-lg border shadow"
              />
            </div>
          )}
          <label className="block text-sm font-medium text-gray-700 mt-3">
            Cover Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            className="mt-1 block w-full"
          />
          {errors.cover_image && (
            <p className="text-red-600 text-xs mt-1">
              {errors.cover_image.message}
            </p>
          )}
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
            <p className="text-red-600 text-xs">{errors.content.message}</p>
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

        <div className="space-y-4">
          <div className="flex items-center space-x-6">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="draft"
                {...register("status")}
                className="form-radio text-blue-600"
              />
              <span className="text-sm text-gray-700">Draft</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="published"
                {...register("status")}
                className="form-radio text-blue-600"
              />
              <span className="text-sm text-gray-700">Published</span>
            </label>
            {errors.status && (
              <p className="text-red-600 text-xs">{errors.status.message}</p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? "Saving..." : "Save Post"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
