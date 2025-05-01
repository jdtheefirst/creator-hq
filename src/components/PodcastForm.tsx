"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/lib/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import TagsInput from "./ui/tagsInput";
import { useRouter } from "next/navigation";

const basePodcastSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  season_number: z.coerce.number().int().positive("Must be positive"),
  episode_number: z.coerce.number().int().positive("Must be positive"),
  duration: z.coerce.number().int().positive("Must be positive"),
  cover_image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  youtube_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  transcript: z.string().max(10000).optional(),
  guest_name: z.string().max(100).optional(),
  tags: z.array(z.string().max(20)).max(10),
  vip: z.boolean().default(false).optional(),
  downloadable: z.boolean().default(true).optional(),
  is_published: z.boolean().default(true).optional(),
  audio_url: z.string().url().optional(),
});

const newPodcastSchema = basePodcastSchema.extend({
  audio_file: z
    .any()
    .refine((file) => file?.length > 0, "Audio file is required")
    .refine(
      (file) => file?.[0]?.size <= 100_000_000,
      "File size must be less than 100MB"
    ),
});

const editPodcastSchema = basePodcastSchema.extend({
  audio_url: z.any().optional(), // Not required in edit mode
});

type PodcastFormData = z.infer<typeof basePodcastSchema> & {
  audio_file?: File[];
};

export default function PodcastForm({
  mode,
  initialData,
}: {
  mode: "new" | "edit";
  initialData?: Partial<PodcastFormData>;
}) {
  const podcastSchema = mode === "edit" ? editPodcastSchema : newPodcastSchema;
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm<PodcastFormData>({
    resolver: zodResolver(podcastSchema),
    defaultValues: {
      tags: [],
      ...initialData,
    },
  });
  const audioFile = watch("audio_file");
  const [uploading, setUploading] = useState(false);
  const { supabase } = useAuth();
  const route = useRouter();

  const handleFormSubmit = async (data: PodcastFormData) => {
    setUploading(true);
    const toastId = toast.loading("Uploading podcast...");

    try {
      const file = data.audio_file?.[0];

      let audioUrl = initialData?.audio_url || null;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user?.id}/podcasts/${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("audios")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        audioUrl = filePath;
      }

      const { error: insertError } = await supabase.from("podcasts").upsert({
        id: initialData?.id,
        title: data.title,
        description: data.description,
        season_number: data.season_number,
        episode_number: data.episode_number,
        duration: data.duration,
        audio_url: audioUrl,
        cover_image_url: data.cover_image_url || null,
        youtube_url: data.youtube_url || null,
        transcript: data.transcript || null,
        guest_name: data.guest_name || null,
        tags: data.tags,
        vip: data.vip,
        downloadable: data.downloadable,
        is_published: data.is_published,
        updated_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      toast.success("Podcast published successfully!", { id: toastId });
      route.push("/podcasts");
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Failed to publish podcast", {
        id: toastId,
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === "new" ? "Publish" : "Edit"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Enter podcast title"
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Enter podcast description"
                  rows={4}
                />

                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="season_number">Season *</Label>
                  <Input
                    id="season_number"
                    type="number"
                    {...register("season_number")}
                    placeholder="1"
                  />
                  {errors.season_number && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.season_number.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="episode_number">Episode *</Label>
                  <Input
                    id="episode_number"
                    type="number"
                    {...register("episode_number")}
                    placeholder="1"
                  />
                  {errors.episode_number && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.episode_number.message}
                    </p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <Label htmlFor="duration">Duration (min) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    {...register("duration")}
                    placeholder="20"
                  />
                  {errors.duration && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.duration.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Media</h3>
              <div>
                <Label htmlFor="audio_file">Audio File *</Label>
                <Input
                  id="audio_file"
                  type="file"
                  accept="audio/*"
                  {...register("audio_file")}
                />
                {audioFile?.[0] && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {audioFile[0].name} (
                    {(audioFile[0].size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cover_image_url">Cover Image URL</Label>
                <Input
                  id="cover_image_url"
                  type="url"
                  {...register("cover_image_url")}
                  placeholder="https://example.com/image.jpg"
                />
                {errors.cover_image_url && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.cover_image_url.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="youtube_url">YouTube URL</Label>
                <Input
                  id="youtube_url"
                  type="url"
                  {...register("youtube_url")}
                  placeholder="https://youtube.com/watch?v=..."
                />
                {errors.youtube_url && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.youtube_url.message}
                  </p>
                )}
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Information</h3>
              <div>
                <Label htmlFor="transcript">Transcript</Label>
                <Textarea
                  id="transcript"
                  {...register("transcript")}
                  placeholder="Full transcript of the podcast"
                  rows={6}
                />
                {errors.transcript && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.transcript.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="guest_name">Guest Name</Label>
                <Input
                  id="guest_name"
                  type="text"
                  {...register("guest_name")}
                  placeholder="Guest name if applicable"
                />
                {errors.guest_name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.guest_name.message}
                  </p>
                )}
              </div>

              <TagsInput<PodcastFormData>
                control={control}
                name="tags"
                label="Tags"
                maxTags={10}
                maxLength={20}
              />
            </div>

            {/* Settings Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Settings</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="vip"
                  checked={watch("vip")}
                  onCheckedChange={(checked) => setValue("vip", checked)}
                />
                <Label htmlFor="vip">VIP Content</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="downloadable"
                  checked={watch("downloadable")}
                  onCheckedChange={(checked) =>
                    setValue("downloadable", checked)
                  }
                />
                <Label htmlFor="downloadable">Downloadable</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={watch("is_published")}
                  onCheckedChange={(checked) =>
                    setValue("is_published", checked)
                  }
                />
                <Label htmlFor="is_published">Published</Label>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading
              ? "Processing..."
              : mode === "new"
                ? "Publish Podcast"
                : "Update Podcast"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
