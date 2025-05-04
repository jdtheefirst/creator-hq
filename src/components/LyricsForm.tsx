"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { TagsInput } from "@/components/ui/tagsInput";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/lib/context/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const lyricsSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(100),
  content: z.string().min(1, "Content is required").max(10000).optional(),
  artist: z.string().optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  album: z.string().optional(),
  release_date: z.date().optional().nullable(),
  video_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  tags: z.array(z.string().max(20)).max(10).optional(),
  status: z.enum(["draft", "published"]).default("draft").optional(),
  comments_enabled: z.boolean().default(true).optional(),
  vip: z.boolean().default(false).optional(),
  cover_image_url: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || val.startsWith("http") || val.includes("/courses/"),
      "Invalid URL"
    ),
  cover_file: z
    .any()
    .optional()
    .refine(
      (file) => !file || file.length === 0 || file?.[0]?.size <= 10_000_000,
      "Cover image size must be less than 10MB"
    ),
});

type LyricsFormData = z.infer<typeof lyricsSchema>;

export default function LyricsForm({
  mode,
  initialData,
}: {
  mode: "new" | "edit";
  initialData?: Partial<LyricsFormData>;
}) {
  const normalizedInitialData: LyricsFormData = {
    ...initialData,
    title: initialData?.title ?? "",
    content: initialData?.content ?? "",
    release_date: initialData?.release_date
      ? new Date(initialData.release_date)
      : null,
    language: initialData?.language ?? "",
    album: initialData?.album ?? "",
    artist: initialData?.artist ?? "",
    status: initialData?.status ?? "draft",
    comments_enabled: initialData?.comments_enabled ?? true,
    vip: initialData?.vip ?? false,
    video_url: initialData?.video_url ?? "",
    cover_image_url: initialData?.cover_image_url ?? "",
    tags: initialData?.tags ?? [],
  };
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<LyricsFormData>({
    resolver: zodResolver(lyricsSchema),
    defaultValues: normalizedInitialData,
  });

  const [uploading, setUploading] = useState(false);
  const { supabase, user } = useAuth();
  const coverFile = watch("cover_file");
  const router = useRouter();

  const handleFormSubmit = async (data: LyricsFormData) => {
    setUploading(true);
    const toastId = toast.loading(
      mode === "new" ? "Saving lyrics..." : "Updating lyrics..."
    );

    try {
      const lyricsData = {
        ...data,
        creator_id: user?.id,
        updated_at: new Date().toISOString(),
      };

      // Handle course file upload
      if (lyricsData.cover_file?.[0]) {
        // Delete old file if exists in edit mode
        if (mode === "edit" && initialData?.cover_image_url) {
          const oldPath = initialData.cover_image_url.split("/covers/")[1];
          await supabase.storage.from("covers").remove([oldPath]);

          toast.success("Old cover image deleted", {
            id: toastId,
          });
        }
        const fileExt = lyricsData.cover_file[0].name.split(".").pop();
        const filePath = `${user?.id}/courses/${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(filePath, lyricsData.cover_file[0]);

        console.log("Upload error:", uploadError); // Debugging line
        if (uploadError) throw uploadError;
        toast.success("Cover image uploaded", {
          id: toastId,
        });

        // Add the file URL to the course data
        lyricsData.cover_image_url = filePath; // Store the full path for RLS checking
      }

      delete lyricsData.cover_file;

      const { error } =
        mode === "new"
          ? await supabase.from("lyrics").insert(lyricsData)
          : await supabase
              .from("lyrics")
              .update(lyricsData)
              .eq("id", initialData?.id);

      if (error) throw error;

      toast.success(mode === "new" ? "Lyrics created!" : "Lyrics updated!", {
        id: toastId,
      });
      router.push("/dashboard/lyrics");
      router.refresh();
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Operation failed", {
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
        <CardTitle>
          {mode === "new" ? "Add New Lyrics" : "Edit Lyrics"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Song title"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="artist">Artist</Label>
                <Input
                  id="artist"
                  {...register("artist")}
                  placeholder="Artist name"
                />
                {errors.artist && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.artist.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="content">Lyrics Content *</Label>
                <Textarea
                  id="content"
                  {...register("content")}
                  placeholder="Enter the lyrics"
                  rows={10}
                  className="font-mono text-sm"
                />
                {errors.content && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.content.message}
                  </p>
                )}
              </div>
            </div>

            {/* Metadata Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  {...register("genre")}
                  placeholder="e.g. Pop, Rock"
                />
                {errors.genre && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.genre.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  {...register("language")}
                  placeholder="e.g. English, Spanish"
                />
                {errors.language && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.language.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="album">Album</Label>
                <Input
                  id="album"
                  {...register("album")}
                  placeholder="Album name"
                />
                {errors.album && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.album.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Release Date</Label>
                <Controller
                  control={control}
                  name="release_date"
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full text-left border rounded-md px-3 py-2 text-sm flex items-center justify-between truncate"
                        >
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick date"}
                          <CalendarIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ?? undefined}
                          onSelect={(date) => {
                            field.onChange(date);
                          }}
                          initialFocus
                          className="w-auto text-xs"
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.release_date && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.release_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="video_url">Video URL</Label>
                <Input
                  id="video_url"
                  type="url"
                  {...register("video_url")}
                  placeholder="https://youtube.com/watch?v=..."
                />
                {errors.video_url && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.video_url.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="cover_file">Cover Image *</Label>
                <Input
                  id="cover_file"
                  type="file"
                  accept="image/*"
                  {...register("cover_file")}
                />
                {watch("cover_image_url") && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    Current: {watch("cover_image_url")}
                  </p>
                )}
                {coverFile?.[0] && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Selected: {coverFile[0].name} (
                    {(coverFile[0].size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
                {errors.cover_file && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.cover_file?.message &&
                      String(errors.cover_file.message)}
                  </p>
                )}
              </div>

              <div>
                <TagsInput<LyricsFormData>
                  control={control}
                  name="tags"
                  label="Tags"
                  maxTags={10}
                  maxLength={20}
                  defaultValue={initialData?.tags || []}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8">
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={watch("status") === "published"}
                  onCheckedChange={(checked) =>
                    setValue("status", checked ? "published" : "draft")
                  }
                />
                <Label htmlFor="status">Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="comments_enabled"
                  checked={watch("comments_enabled")}
                  onCheckedChange={(checked) =>
                    setValue("comments_enabled", checked)
                  }
                />
                <Label htmlFor="comments_enabled">Comments Enabled</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="vip"
                  checked={watch("vip")}
                  onCheckedChange={(checked) => setValue("vip", checked)}
                />
                <Label htmlFor="vip">VIP Content</Label>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={uploading}
          >
            {uploading
              ? "Processing..."
              : mode === "new"
                ? "Add Lyrics"
                : "Update Lyrics"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
