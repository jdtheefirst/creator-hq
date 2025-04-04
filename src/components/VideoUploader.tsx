"use client";

import { useState, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { Upload, X, Youtube } from "lucide-react";
import axios from "axios";

interface VideoUploaderProps {
  onUploadComplete: (url: string, thumbnailUrl: string) => void;
  onYouTubeAdd: (videoId: string, thumbnailUrl: string) => void;
}

export default function VideoUploader({
  onUploadComplete,
  onYouTubeAdd,
}: VideoUploaderProps) {
  const { user } = useAuth();
  const supabase = createBrowserClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadType, setUploadType] = useState<"upload" | "youtube" | null>(
    null
  );
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/videos/${fileName}`; // Path relative to bucket

      // 🔹 Step 1: Generate Signed Upload URL
      const { data, error } = await supabase.storage
        .from("videos")
        .createSignedUploadUrl(filePath);

      if (error) throw error;

      // 🔹 Step 2: Upload File Using Axios (Tracks Progress)
      await axios.put(data.signedUrl, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setProgress((progressEvent.loaded / progressEvent.total) * 100);
          }
        },
      });

      // 🔹 Step 3: Generate Thumbnail Path (if needed)
      const thumbnailPath = `${user?.id}/thumbnails/${fileName}`;

      // 🔹 Step 4: Get Public URLs (Fix Destructuring)
      const videoUrl = supabase.storage.from("videos").getPublicUrl(filePath)
        .data.publicUrl;
      const thumbnailUrl = supabase.storage
        .from("videos")
        .getPublicUrl(thumbnailPath).data.publicUrl;

      // 🔹 Step 5: Notify Completion
      onUploadComplete(videoUrl, thumbnailUrl);
      toast.success("Video uploaded successfully!");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleYouTubeAdd = () => {
    try {
      // Extract video ID from YouTube URL
      const videoId = new URL(youtubeUrl).searchParams.get("v");
      if (!videoId) throw new Error("Invalid YouTube URL");

      // Get thumbnail
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      onYouTubeAdd(videoId, thumbnailUrl);
      toast.success("YouTube video added successfully");
      setYoutubeUrl("");
    } catch (error) {
      toast.error("Invalid YouTube URL");
    }
  };

  return (
    <div className="space-y-4">
      {!uploadType ? (
        <div className="flex gap-4">
          <button
            onClick={() => setUploadType("upload")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Upload className="w-4 h-4" />
            Upload Video
          </button>
          <button
            onClick={() => setUploadType("youtube")}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Youtube className="w-4 h-4" />
            Add YouTube Video
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setUploadType(null)}
            className="absolute -top-2 -right-2 p-1 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </button>

          {uploadType === "upload" ? (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={(e) =>
                  e.target.files?.[0] && handleFileUpload(e.target.files[0])
                }
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 flex items-center justify-center"
              >
                {uploading ? (
                  <div className="text-center">
                    <div className="h-2 w-full bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-blue-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {Math.round(progress)}%
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Click to upload video
                    </p>
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Enter YouTube URL"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleYouTubeAdd}
                disabled={!youtubeUrl}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Add YouTube Video
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
