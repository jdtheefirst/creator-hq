// src/components/CourseForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";

const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0),
  level: z.string().min(1),
  duration: z.string().min(1),
  cover_image_url: z.string().url().optional(),
  vip: z.boolean().optional(),
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
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: initialData,
  });

  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { supabase } = useAuth();

  const onSubmit = async (data: CourseFormData) => {
    setSubmitting(true);

    try {
      if (mode === "new") {
        // Create new course
        const { error } = await supabase.from("courses").insert({
          ...data,
          creator_id: process.env.NEXT_PUBLIC_CREATOR_UID,
        });

        if (error) throw error;

        alert("Course created successfully!");
      } else {
        // Update existing course
        const { error } = await supabase
          .from("courses")
          .update(data)
          .eq("id", initialData?.id);

        if (error) throw error;

        alert("Course updated successfully!");
      }

      router.push("/dashboard/courses");
    } catch (err) {
      console.error("Submission error:", err);
      alert("Something went wrong. Check console.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input {...register("title")} className="input" />
        {errors.title && <p className="error">{errors.title.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea {...register("description")} className="input" rows={4} />
        {errors.description && (
          <p className="error">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Level
          </label>
          <input {...register("level")} className="input" />
          {errors.level && <p className="error">{errors.level.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Duration
          </label>
          <input {...register("duration")} className="input" />
          {errors.duration && (
            <p className="error">{errors.duration.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price ($)
          </label>
          <input type="number" {...register("price")} className="input" />
          {errors.price && <p className="error">{errors.price.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Cover Image URL
        </label>
        <input type="url" {...register("cover_image_url")} className="input" />
      </div>

      <div className="flex items-center space-x-2">
        <input type="checkbox" {...register("vip")} />
        <label className="text-sm text-gray-700">VIP Course</label>
      </div>

      <Button type="submit" disabled={submitting}>
        {mode === "new" ? "Create Course" : "Update Course"}
      </Button>
    </form>
  );
}
