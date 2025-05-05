"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { TagsInput } from "./ui/tagsInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { Progress } from "./ui/progress";

const courseSchema = z
  .object({
    id: z.string().optional(),
    title: z.string().min(1, "Title is required").max(100),
    description: z.string().min(1, "Description is required").max(2000),
    tags: z.array(z.string().max(20)).max(10).optional(),
    category: z.string().min(1, "Category is required"),
    language: z.string().min(1, "Language is required"),
    price: z.coerce.number().min(0, "Price must be positive"),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    duration: z.string().min(1, "Duration is required"),
    content: z.string().max(10000).optional(),
    status: z.enum(["draft", "published"]).default("draft").optional(),
    comments_enabled: z.boolean().default(true).optional(),
    course_type: z.enum(["video", "audio", "text"]),
    course_format: z.enum(["live", "on-demand"]),
    vip: z.boolean().default(false).optional(),
    featured: z
      .boolean({
        required_error: "Featured is required",
        invalid_type_error: "Featured must be a boolean",
      })
      .default(false)
      .optional(),
    cover_image_url: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || val.startsWith("http") || val.includes("/courses/"),
        "Invalid URL"
      ),
    audio_url: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || val.startsWith("http") || val.includes("/courses/"),
        "Invalid URL"
      ),
    video_url: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || val.startsWith("http") || val.includes("/courses/"),
        "Invalid URL"
      ),
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
    video_file: z
      .any()
      .optional()
      .refine(
        (file) => !file || file.length === 0 || file?.[0]?.size <= 20_000_000,
        "Video file size must be less than 10MB"
      ),
  })
  .superRefine((data, ctx) => {
    if (
      data.course_type === "video" &&
      !data.video_url &&
      !data.video_file?.[0]
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Video file is required",
        path: ["video_file"],
      });
    }
    if (
      data.course_type === "audio" &&
      !data.audio_url &&
      !data.audio_file?.[0]
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Audio file is required",
        path: ["audio_file"],
      });
    }
    if (data.course_type === "text" && !data.content) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Text content is required",
        path: ["content"],
      });
    }
  });

type CourseFormData = z.infer<typeof courseSchema> & {
  audio_file?: File[];
  video_file?: File[];
  cover_file?: File[];
};

export default function CourseForm({
  mode,
  initialData,
}: {
  mode: "new" | "edit";
  initialData?: Partial<CourseFormData>;
}) {
  const normalizedInitialData: CourseFormData = {
    ...initialData,
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? "",
    language: initialData?.language ?? "",
    price: initialData?.price ?? 0,
    level: initialData?.level ?? "beginner",
    duration: initialData?.duration ?? "",
    course_type: initialData?.course_type ?? "video",
    course_format: initialData?.course_format ?? "on-demand",
    status: initialData?.status ?? "draft",
    comments_enabled: initialData?.comments_enabled ?? true,
    vip: initialData?.vip ?? false,
    featured: initialData?.featured ?? false,
    audio_url: initialData?.audio_url ?? "",
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
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: normalizedInitialData,
  });

  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const { supabase, user } = useAuth();
  const coverFile = watch("cover_file");
  const courseType = watch("course_type");

  const onSubmit = async (data: CourseFormData) => {
    setSubmitting(true);
    const toastId = toast.loading(
      mode === "new" ? "Creating course..." : "Updating course..."
    );

    try {
      // ✂️ Create clean course data WITHOUT 'featured'
      const { featured, ...courseDataClean } = data;
      const courseData = {
        ...courseDataClean,
        creator_id: user?.id,
        updated_at: new Date().toISOString(),
      };

      let courseId = initialData?.id;

      // Handle content file upload
      if (courseData.video_file?.[0] && courseType === "video") {
        // Delete old file if exists in edit mode
        if (mode === "edit" && initialData?.video_url) {
          const oldPath = initialData.video_url.split("/").pop();
          await supabase.storage.from("courses").remove([oldPath!]);

          toast.success("Old video file deleted", {
            id: toastId,
          });
        }

        const fileExt = courseData.video_file[0].name.split(".").pop();
        const fileType = courseData.video_file[0].type;
        const filePath = `${user?.id}/courses/${uuidv4()}.${fileExt}`;

        // 🔹 Step 1: Generate Signed Upload URL
        const { data, error } = await supabase.storage
          .from("courses")
          .createSignedUploadUrl(filePath);

        if (error) throw error;

        // 🔹 Step 2: Upload File Using Axios (Tracks Progress)
        await axios
          .put(data.signedUrl, courseData.video_file[0], {
            headers: { "Content-Type": fileType },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                setProgress((progressEvent.loaded / progressEvent.total) * 100);
              }
            },
          })
          .catch((error) => {
            console.error("Upload error:", error);
            toast.error("Upload failed", {
              id: toastId,
            });
            setSubmitting(false);
            return;
          });

        toast.success("Video file uploaded", {
          id: toastId,
        });

        courseData.video_url = filePath; // Store the full path for RLS checking
      }

      //handle audio file upload
      if (courseData.audio_file?.[0] && courseType === "audio") {
        // Delete old file if exists in edit mode
        if (mode === "edit" && initialData?.audio_url) {
          const oldPath = initialData.audio_url.split("/").pop();
          await supabase.storage.from("courses").remove([oldPath!]);

          toast.success("Old audio file deleted", {
            id: toastId,
          });
        }

        const fileExt = courseData.audio_file[0].name.split(".").pop();
        const filePath = `${user?.id}/courses/${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("courses")
          .upload(filePath, courseData.audio_file[0]);

        console.log("Upload error:", uploadError); // Debugging line
        if (uploadError) throw uploadError;

        toast.success("Audio file uploaded", {
          id: toastId,
        });

        courseData.audio_url = filePath; // Store the full path for RLS checking
      }

      // Handle course file upload
      if (courseData.cover_file?.[0]) {
        // Delete old file if exists in edit mode
        if (mode === "edit" && initialData?.cover_image_url) {
          const oldPath = initialData.cover_image_url.split("/covers/")[1];
          await supabase.storage.from("covers").remove([oldPath]);

          toast.success("Old cover image deleted", {
            id: toastId,
          });
        }
        const fileExt = courseData.cover_file[0].name.split(".").pop();
        const filePath = `${user?.id}/courses/${uuidv4()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(filePath, courseData.cover_file[0]);

        console.log("Upload error:", uploadError); // Debugging line
        if (uploadError) throw uploadError;
        toast.success("Cover image uploaded", {
          id: toastId,
        });

        // Add the file URL to the course data
        courseData.cover_image_url = filePath; // Store the full path for RLS checking
      }

      delete courseData.audio_file;
      delete courseData.video_file;
      delete courseData.cover_file;

      if (mode === "new") {
        const { error, data: insertResult } = await supabase
          .from("courses")
          .insert(courseData)
          .select("id")
          .single();

        if (error) throw error;
        courseId = insertResult.id;
      } else {
        const { error } = await supabase
          .from("courses")
          .update(courseData)
          .eq("id", courseId);

        if (error) throw error;
      }

      const courseUrl = `/courses/${courseId}`;

      // 🎯 Handle featured logic separately — always runs, no mutation jank
      if (featured) {
        await supabase.rpc("feature_content", {
          _creator_id: user?.id,
          _type: "course",
          _title: courseData.title,
          _description: courseData.description,
          _thumbnail_url: courseData.cover_image_url,
          _url: courseUrl,
          _is_vip: courseData.vip || false,
        });
      } else {
        await supabase
          .from("featured_content")
          .delete()
          .eq("creator_id", user?.id)
          .eq("type", "course")
          .eq("url", courseUrl);
      }

      toast.success(mode === "new" ? "Course created!" : "Course updated!", {
        id: toastId,
      });

      router.push("/dashboard/courses");
      router.refresh();
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Operation failed", {
        id: toastId,
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>
          {mode === "new" ? "Create New Course" : "Edit Course"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Course title"
                />
                {errors.title && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Course description"
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>

            {/* Metadata Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Course Details</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    {...register("category")}
                    placeholder="e.g. Programming, Design"
                  />
                  {errors.category && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="language">Language *</Label>
                  <Input
                    id="language"
                    {...register("language")}
                    placeholder="e.g. English, Spanish"
                  />
                  {errors.language && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.language.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="level">Level *</Label>
                  <Select
                    onValueChange={(value) => setValue("level", value as any)}
                    defaultValue={watch("level")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.level && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.level.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    {...register("duration")}
                    placeholder="e.g. 4 weeks, 10 hours"
                  />
                </div>

                <div>
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register("price")}
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.price.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course_type">Content Type *</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("course_type", value as any)
                    }
                    defaultValue={watch("course_type")}
                    disabled={mode === "edit"}
                    required={mode === "new"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.course_type && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.course_type.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="course_format">Format *</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("course_format", value as any)
                    }
                    defaultValue={watch("course_format")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="on-demand">On-Demand</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.course_format && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.course_format.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Media Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Media</h3>

              <div>
                <Label htmlFor="content_file">
                  {courseType === "video"
                    ? "Video File"
                    : courseType === "audio"
                      ? "Audio File"
                      : "Text Content"}{" "}
                  *
                </Label>
                {courseType === "video" && (
                  <div>
                    <Progress value={progress} className="mb-2" />
                    <Input
                      id="video_file"
                      type="file"
                      accept="video/*"
                      {...register("video_file")}
                    />
                    {watch("video_url") && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        Current: {watch("video_url")}
                      </p>
                    )}
                    {errors.video_file && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.video_file.message &&
                          String(errors.video_file.message)}
                      </p>
                    )}
                  </div>
                )}
                {courseType === "audio" && (
                  <div>
                    <Input
                      id="audio_file"
                      type="file"
                      accept="audio/*"
                      {...register("audio_url")}
                    />
                    {watch("audio_url") && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        Current: {watch("audio_url")}
                      </p>
                    )}

                    {errors.audio_file && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.audio_file.message &&
                          String(errors.audio_file.message)}
                      </p>
                    )}
                  </div>
                )}
                {courseType === "text" && (
                  <div>
                    <Textarea
                      id="content"
                      {...register("content")}
                      placeholder="Detailed course content"
                      rows={6}
                      defaultValue={watch("content")}
                    />
                    {errors.content && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.content.message}
                      </p>
                    )}
                  </div>
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
                <TagsInput<CourseFormData>
                  control={control}
                  name="tags"
                  label="Tags"
                  maxTags={10}
                  maxLength={20}
                />
              </div>
            </div>

            {/* Settings Section */}
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
                <Label htmlFor="vip">VIP Course</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={watch("featured")}
                  onCheckedChange={(checked) => setValue("featured", checked)}
                />
                <Label htmlFor="featured">Featured</Label>
                {errors.featured && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.featured?.message &&
                      String(errors.featured.message)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting
              ? "Processing..."
              : mode === "new"
                ? "Create Course"
                : "Update Course"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
