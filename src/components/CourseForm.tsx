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

const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().min(1, "Description is required").max(2000),
  tags: z.array(z.string().max(20)).max(10).optional(),
  category: z.string().min(1, "Category is required"),
  language: z.string().min(1, "Language is required"),
  url: z.string().url("Invalid URL").optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  duration: z.string().min(1, "Duration is required"),
  cover_image_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  content: z.string().max(10000).optional(),
  status: z.enum(["draft", "published"]).default("draft").optional(),
  comments_enabled: z.boolean().default(true).optional(),
  course_type: z.enum(["video", "audio", "text"]),
  course_format: z.enum(["live", "on-demand"]),
  vip: z.boolean().default(false).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

export default function CourseForm({
  mode,
  initialData,
}: {
  mode: "new" | "edit";
  initialData?: Partial<CourseFormData>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      status: "draft",
      comments_enabled: initialData?.comments_enabled ?? true,
      vip: initialData?.vip ?? false,
      tags: [],
      ...initialData,
    },
  });

  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { supabase, user } = useAuth();

  const onSubmit = async (data: CourseFormData) => {
    setSubmitting(true);
    const toastId = toast.loading(
      mode === "new" ? "Creating course..." : "Updating course..."
    );

    try {
      const courseData = {
        ...data,
        creator_id: user?.id,
        updated_at: new Date().toISOString(),
      };

      const { error } =
        mode === "new"
          ? await supabase.from("courses").insert(courseData)
          : await supabase
              .from("courses")
              .update(courseData)
              .eq("id", initialData?.id);

      if (error) throw error;

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

              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  {...register("content")}
                  placeholder="Detailed course content"
                  rows={6}
                />
                {errors.content && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.content.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="url">Content URL</Label>
                <Input
                  id="url"
                  type="url"
                  {...register("url")}
                  placeholder="https://example.com/course-content"
                />
                {errors.url && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.url.message}
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
                <Label htmlFor="cover_image_url">Cover Image URL</Label>
                <Input
                  id="cover_image_url"
                  type="url"
                  {...register("cover_image_url")}
                  placeholder="https://example.com/image.jpg"
                />
                {errors.cover_image_url && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.cover_image_url.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
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
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Settings</h3>

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
