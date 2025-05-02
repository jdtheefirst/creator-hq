"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Define which content types have files and where
const storageFields: Record<string, { bucket: string; field: string }[]> = {
  videos: [
    { bucket: "videos", field: "url" },
    { bucket: "thumbnails", field: "thumbnail_url" },
  ],
  podcasts: [
    { bucket: "audios", field: "audio_url" },
    { bucket: "covers", field: "cover_image_url" },
  ],
  courses: [
    { bucket: "courses", field: "url" },
    { bucket: "covers", field: "cover_image_url" },
  ],
  lyrics: [
    { bucket: "covers", field: "cover_image_url" },
    { bucket: "videos", field: "video_url" },
  ],
  blogs: [{ bucket: "covers", field: "cover_image" }],
  products: [
    { bucket: "products", field: "thumbnail_url" },
    { bucket: "products", field: "digital_file_url" },
  ],
  product_variants: [
    { bucket: "products", field: "thumbnail_url" },
    { bucket: "products", field: "digital_file_url" },
  ],
};

type DeleteButtonProps = {
  contentType: keyof typeof storageFields;
  contentId: string;
};

export default function DeleteButton({
  contentType,
  contentId,
}: DeleteButtonProps) {
  const { supabase } = useAuth();
  const router = useRouter();

  const handleDelete = async () => {
    const confirmDelete = confirm(
      `Are you sure you want to delete this ${contentType}?`
    );
    if (!confirmDelete) return;
    toast.loading("Deleting content...");
    // 1. Fetch content to get stored file paths
    const { data: contentData, error } = await supabase
      .from(contentType)
      .select("*")
      .eq("id", contentId)
      .single();

    if (error) {
      console.error("Fetch failed", error);
      return alert("Failed to fetch content. See console for details.");
    }

    // 2. Delete associated storage files (raw paths)
    const fileConfigs = storageFields[contentType];
    for (const { bucket, field } of fileConfigs) {
      const path = contentData[field];
      if (path) {
        const fullPath = path.includes("/") ? path : `${bucket}/${path}`;
        await supabase.storage.from(bucket).remove([fullPath]);
      }
    }

    // 3. Delete the actual content row
    await supabase.from(contentType).delete().eq("id", contentId);
    toast.dismiss();
    toast.success("Content deleted successfully!");
    window.location.reload();
  };

  return (
    <button
      onClick={handleDelete}
      className="p-1 text-red-600 hover:text-red-800"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
