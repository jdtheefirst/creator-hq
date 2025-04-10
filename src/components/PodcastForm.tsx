// src/components/dashboard/podcasts/PodcastForm.tsx
"use client";

import { Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { createBrowserClient } from "@/lib/supabase/client";

const podcastSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  season_number: z.coerce.number().min(1),
  episode_number: z.coerce.number().min(1),
  duration: z.coerce.number().min(1),
  audio_file: z.any().optional(), // Will be a File
  cover_image_url: z.string().optional(),
  youtube_url: z.string().url().optional(),
  transcript: z.string().optional(),
  guest_name: z.string().optional(),
  tags: z.array(z.string()).optional(),
  downloadable: z.boolean().default(true),
  is_published: z.boolean().default(true),
});

type PodcastFormData = z.infer<typeof podcastSchema>;

export default function PodcastForm({
  mode,
  initialData,
}: {
  mode: "new" | "edit";
  initialData?: Partial<PodcastFormData>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PodcastFormData>({
    resolver: zodResolver(podcastSchema) as Resolver<PodcastFormData>,
    defaultValues: initialData,
  });

  const [uploading, setUploading] = useState(false);
  const audioFile = watch("audio_file");
  const supabase = createBrowserClient();

  const handleFormSubmit = async (data: PodcastFormData) => {
    const file = data.audio_file?.[0];
    if (!file) return alert("Audio file is required.");

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `podcasts/${uuidv4()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("audios")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("audios")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("podcasts").insert({
        title: data.title,
        description: data.description,
        season_number: data.season_number,
        episode_number: data.episode_number,
        duration: data.duration,
        audio_url: publicUrlData.publicUrl,
        cover_image_url: data.cover_image_url,
        youtube_url: data.youtube_url,
        transcript: data.transcript,
        guest_name: data.guest_name,
        tags: data.tags,
        downloadable: data.downloadable,
        is_published: data.is_published,
      });

      if (insertError) throw insertError;

      alert("Podcast published 🎙️🔥");
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
          Description
        </label>
        <textarea
          {...register("description")}
          className="mt-1 block w-full border rounded p-2"
          rows={4}
        />
        {errors.description && (
          <p className="text-red-600 text-sm">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Season
          </label>
          <input
            type="number"
            {...register("season_number")}
            className="mt-1 block w-full border rounded p-2"
          />
          {errors.season_number && (
            <p className="text-red-600 text-sm">
              {errors.season_number.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Episode
          </label>
          <input
            type="number"
            {...register("episode_number")}
            className="mt-1 block w-full border rounded p-2"
          />
          {errors.episode_number && (
            <p className="text-red-600 text-sm">
              {errors.episode_number.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Duration (seconds)
        </label>
        <input
          type="number"
          {...register("duration")}
          className="mt-1 block w-full border rounded p-2"
        />
        {errors.duration && (
          <p className="text-red-600 text-sm">{errors.duration.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Audio File
        </label>
        <input
          type="file"
          accept="audio/*"
          {...register("audio_file")}
          className="mt-1 block w-full"
        />
        {audioFile?.[0] && (
          <p className="text-sm text-gray-500 mt-1">
            Selected: {audioFile[0].name}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Cover Image URL
        </label>
        <input
          type="text"
          {...register("cover_image_url")}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          YouTube URL
        </label>
        <input
          type="text"
          {...register("youtube_url")}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Transcript
        </label>
        <textarea
          {...register("transcript")}
          className="mt-1 block w-full border rounded p-2"
          rows={4}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Guest Name
        </label>
        <input
          type="text"
          {...register("guest_name")}
          className="mt-1 block w-full border rounded p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tags (comma separated)
        </label>
        <input
          type="text"
          {...register("tags")}
          className="mt-1 block w-full border rounded p-2"
          placeholder="e.g. technology, podcast"
        />
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register("downloadable")}
            className="mr-2"
          />
          Downloadable
        </label>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            {...register("is_published")}
            className="mr-2"
          />
          Is Published
        </label>
      </div>

      <Button type="submit" disabled={uploading}>
        {mode === "new" ? "Publish Podcast" : "Update Podcast"}
      </Button>
    </form>
  );
}
