"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import { Link2, Upload, X } from "lucide-react";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface VideoUploaderProps {
  onUploadComplete: (url: string, thumbnailUrl: string) => void;
  onYouTubeAdd: (videoId: string, thumbnailUrl: string, source: string) => void;
}

export default function VideoUploader({
  onUploadComplete,
  onYouTubeAdd,
}: VideoUploaderProps) {
  const { user, supabase } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadType, setUploadType] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);

  const videoURL = selectedVideo ? URL.createObjectURL(selectedVideo) : null;
  const thumbnailURL = selectedThumbnail
    ? URL.createObjectURL(selectedThumbnail)
    : null;

  const handleFileUpload = async (file: File, thumbnail: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id}/videos/${fileName}`; // Path relative to bucket
      const thumbnailExt = thumbnail.name.split(".").pop();
      const thumbnailName = `${Math.random().toString(36).substring(2)}.${thumbnailExt}`;
      const thumbnailPath = `${user?.id}/thumbnails/${thumbnailName}`; // Path relative to bucket

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

      const { data: thumbnailData, error: thumbnailError } =
        await supabase.storage
          .from("videos")
          .createSignedUploadUrl(thumbnailPath);

      if (thumbnailError) throw thumbnailError;

      await axios.put(thumbnailData.signedUrl, thumbnail, {
        headers: { "Content-Type": thumbnail.type },
      });

      // 🔹 Step 5: Notify Completion
      onUploadComplete(filePath, thumbnailPath);
      toast.success("Video uploaded successfully!");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    } finally {
      setUploading(false);
      setProgress(0);
      setUploadType(null);
    }
  };

  const handleVideoUrlAdd = () => {
    if (!uploadType) {
      toast.error("Please select a video source.");
      return;
    }

    try {
      const url = new URL(youtubeUrl.trim());
      let videoId = "";
      let thumbnailUrl = "";
      const source = uploadType as
        | "youtube"
        | "vimeo"
        | "twitch"
        | "facebook"
        | "custom";

      switch (source) {
        case "youtube": {
          const host = url.hostname;
          if (host.includes("youtu.be")) {
            // Shortlink: youtu.be/<id>
            videoId = url.pathname.split("/").pop()!;
          } else if (host.includes("youtube.com")) {
            // Full link: youtube.com/watch?v=<id>
            videoId = url.searchParams.get("v")!;
          }
          if (!videoId) throw new Error("Invalid YouTube URL");
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
          break;
        }

        case "vimeo": {
          videoId = url.pathname.split("/").filter(Boolean).pop()!;
          if (!videoId) throw new Error("Invalid Vimeo URL");
          thumbnailUrl = `https://vumbnail.com/${videoId}.jpg`;
          break;
        }

        case "twitch": {
          const parts = url.pathname.split("/");
          if (parts.includes("videos")) {
            videoId = parts.pop()!;
          }
          thumbnailUrl = ""; // Optional: Twitch needs API for this
          break;
        }

        case "facebook":
        case "custom": {
          videoId = youtubeUrl;
          thumbnailUrl = ""; // Facebook & custom embeds need API or manual uploads
          break;
        }

        default:
          throw new Error("Unsupported source");
      }

      if (!videoId) throw new Error("Could not extract video ID");

      onYouTubeAdd(videoId, thumbnailUrl, source);
      toast.success(`${source} video added successfully`);
      setYoutubeUrl("");
    } catch (err) {
      toast.error("Invalid or unsupported video URL");
    } finally {
      setUploadType(null);
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
            Upload
          </button>
          <button
            onClick={() => setUploadType("youtube")}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Link2 className="w-4 h-4" />
            Add Url
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
              {/* Video Picker */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setSelectedVideo(e.target.files?.[0] || null)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 flex items-center justify-center"
              >
                {selectedVideo ? (
                  <video
                    src={videoURL!}
                    className="max-h-28 rounded shadow-md"
                    controls
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Click to choose a video
                    </p>
                  </div>
                )}
              </button>

              {/* Thumbnail Picker */}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="thumbnailInput"
                onChange={(e) =>
                  setSelectedThumbnail(e.target.files?.[0] || null)
                }
              />
              <button
                onClick={() =>
                  document.getElementById("thumbnailInput")?.click()
                }
                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 flex items-center justify-center"
              >
                {selectedThumbnail ? (
                  <img
                    src={thumbnailURL!}
                    alt="Thumbnail Preview"
                    className="max-h-28 rounded shadow-md object-cover"
                  />
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Click to choose a thumbnail
                    </p>
                  </div>
                )}
              </button>

              {/* Upload Button */}
              <button
                disabled={!selectedVideo || !selectedThumbnail || uploading}
                onClick={() =>
                  handleFileUpload(selectedVideo!, selectedThumbnail!)
                }
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {uploading
                  ? `Uploading (${Math.round(progress)}%)...`
                  : "Upload Video & Thumbnail"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-1">
                Select Source
              </label>
              <Select
                defaultValue="youtube"
                value={uploadType}
                onValueChange={(value) => setUploadType(value)}
              >
                <SelectTrigger>
                  {/* This is the visible part of the select dropdown */}
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  {/* This is the dropdown menu */}
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                  <SelectItem value="twitch">Twitch</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="url"
                required
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Enter URL"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />

              <button
                onClick={handleVideoUrlAdd}
                disabled={!youtubeUrl}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Add Url
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
