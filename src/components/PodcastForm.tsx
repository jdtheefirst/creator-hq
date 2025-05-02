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
import { TagsInput } from "./ui/tagsInput";
import { useRouter } from "next/navigation";

const basePodcastSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  season_number: z.coerce.number().int().positive("Must be positive"),
  episode_number: z.coerce.number().int().positive("Must be positive"),
  duration: z.coerce.number().int().positive("Must be positive"),
  cover_image_url: z.string().optional().or(z.literal("")),
  youtube_url: z
    .string()
    .url("Invalid URL")
    .optional()
    .or(z.literal(""))
    .nullable(),
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
      (file) => file?.[0]?.size <= 10_000_000,
      "File size must be less than 10MB"
    ),
  cover_file: z
    .any()
    .refine((file) => file?.length > 0, "Cover file is required")
    .refine(
      (file) => file?.[0]?.size <= 10_000_000,
      "File size must be less than 10MB"
    ),
});

const editPodcastSchema = basePodcastSchema.extend({
  audio_url: z.any().optional(),
  audio_file: z
    .any()
    .optional()
    .refine(
      (file) => !file || file.length === 0 || file?.[0]?.size <= 10_000_000,
      "Cover image size must be less than 10MB"
    ),
  cover_file: z
    .any()
    .optional()
    .refine(
      (file) => !file || file.length === 0 || file?.[0]?.size <= 10_000_000,
      "Cover image size must be less than 10MB"
    ),
});

type PodcastFormData = z.infer<typeof basePodcastSchema> & {
  audio_file?: File[];
  cover_file?: File[];
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
  const coverFile = watch("cover_file");
  const [uploading, setUploading] = useState(false);
  const { supabase } = useAuth();
  const route = useRouter();
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const handleFormSubmit = async (data: PodcastFormData) => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    setUploading(true);
    const toastId = toast.loading(
      mode === "edit" ? "Updating podcast..." : "Creating podcast..."
    );

    try {
      let audioUrl = initialData?.audio_url;
      let coverUrl = initialData?.cover_image_url;

      // Handle audio file upload
      if (data.audio_file?.[0]) {
        // Delete old file if exists in edit mode
        if (mode === "edit" && initialData?.audio_url) {
          const oldPath = initialData.audio_url.split("/audios/")[1];
          await supabase.storage.from("audios").remove([oldPath]);
        }

        const fileExt = data.audio_file[0].name.split(".").pop();
        const filePath = `${user.id}/audios/${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("audios")
          .upload(filePath, data.audio_file[0]);

        if (uploadError) throw uploadError;

        audioUrl = filePath; // Store the full path for RLS checking
      }

      // Handle cover file upload
      if (data.cover_file?.[0]) {
        // Delete old file if exists in edit mode
        if (mode === "edit" && initialData?.cover_image_url) {
          const oldPath = initialData.cover_image_url.split("/covers/")[1];
          await supabase.storage.from("covers").remove([oldPath]);
          toast.success("Old cover image deleted", {
            id: toastId,
          });
        }

        const coverExt = data.cover_file[0].name.split(".").pop();
        const coverPath = `${user.id}/covers/${uuidv4()}.${coverExt}`;

        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(coverPath, data.cover_file[0]);

        if (uploadError) throw uploadError;
        toast.success("Cover image uploaded", {
          id: toastId,
        });

        coverUrl = coverPath; // Store the full path for RLS checking
      }

      // Upsert podcast data
      const { error } = await supabase.from("podcasts").upsert({
        id: initialData?.id || undefined,
        creator_id: user.id,
        title: data.title,
        description: data.description,
        season_number: data.season_number,
        episode_number: data.episode_number,
        duration: data.duration,
        audio_url: audioUrl,
        cover_image_url: coverUrl,
        youtube_url: data.youtube_url || null,
        transcript: data.transcript || null,
        guest_name: data.guest_name || null,
        tags: data.tags || [],
        vip: data.vip ?? false,
        downloadable: data.downloadable ?? true,
        is_published: data.is_published ?? true,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success(mode === "edit" ? "Podcast updated!" : "Podcast created!", {
        id: toastId,
      });
      route.push("/dashboard/podcasts");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Operation failed", {
        id: toastId,
        description: error instanceof Error ? error.message : "Unknown error",
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
              {/* Audio File Input */}
              <div>
                <Label htmlFor="audio_file">
                  Audio File {mode === "new" ? "*" : "(Optional)"}
                </Label>
                <Input
                  id="audio_file"
                  type="file"
                  accept="audio/*"
                  {...register("audio_file")}
                />
                {audioFile?.[0] ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {audioFile[0].name} (
                    {(audioFile[0].size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                ) : initialData?.audio_url ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Current: {initialData.audio_url.split("/").pop()}
                  </p>
                ) : null}
                {errors.audio_file && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.audio_file.message}
                  </p>
                )}
              </div>
              {/* Cover File Input */}
              <div>
                <Label htmlFor="cover_file">
                  Cover Image {mode === "new" ? "*" : "(Optional)"}
                </Label>
                <Input
                  id="cover_file"
                  type="file"
                  accept="image/*"
                  {...register("cover_file")}
                />
                {coverFile?.[0] ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {coverFile[0].name} (
                    {(coverFile[0].size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                ) : initialData?.cover_image_url ? (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Current:</p>
                    <img
                      src={`${projectUrl}/storage/v1/object/public/covers/${initialData.cover_image_url}`}
                      alt="Current cover"
                      className="h-20 w-20 object-cover rounded"
                    />
                  </div>
                ) : null}

                {errors.audio_file && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.audio_file.message}
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
                defaultValue={initialData?.tags || []}
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
