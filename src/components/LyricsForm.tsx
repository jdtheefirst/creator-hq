"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createBrowserClient } from "@/lib/supabase/client";

const lyricsSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  artist: z.string().optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  video_url: z.string().url().optional(),
});

type LyricsFormData = z.infer<typeof lyricsSchema>;

export default function LyricsForm({
  mode,
  initialData,
  userId,
}: {
  mode: "new" | "edit";
  initialData?: Partial<LyricsFormData>;
  userId: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LyricsFormData>({
    resolver: zodResolver(lyricsSchema),
    defaultValues: initialData,
  });

  const [uploading, setUploading] = useState(false);
  const supabase = createBrowserClient();

  const handleFormSubmit = async (data: LyricsFormData) => {
    setUploading(true);

    try {
      if (mode === "new") {
        // Create new lyrics
        const { error } = await supabase.from("lyrics").insert({
          ...data,
          creator_id: userId,
        });

        if (error) throw error;

        alert("Lyrics added successfully!");
      } else {
        // Update existing lyrics
        const { error } = await supabase
          .from("lyrics")
          .update(data)
          .eq("id", initialData?.id);

        if (error) throw error;

        alert("Lyrics updated successfully!");
      }
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong. Check console.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          {...register("title")}
          className="mt-1 block w-full border rounded p-2"
        />
        {errors.title && (
          <p className="text-red-600 text-sm">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <textarea
          {...register("content")}
          className="mt-1 block w-full border rounded p-2"
          rows={4}
        />
        {errors.content && (
          <p className="text-red-600 text-sm">{errors.content.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Artist
        </label>
        <input
          {...register("artist")}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Genre</label>
        <input
          {...register("genre")}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Language
        </label>
        <input
          {...register("language")}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Video URL
        </label>
        <input
          type="url"
          {...register("video_url")}
          className="mt-1 block w-full border rounded p-2"
        />
        {errors.video_url && (
          <p className="text-red-600 text-sm">{errors.video_url.message}</p>
        )}
      </div>

      <Button type="submit" disabled={uploading}>
        {mode === "new" ? "Add Lyrics" : "Update Lyrics"}
      </Button>
    </form>
  );
}
