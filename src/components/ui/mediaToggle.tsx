"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Play, Volume2, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type MediaType = "cover" | "video" | "audio" | "text";

export function CourseMediaToggle({
  coverUrl,
  title,
  videoUrl,
  audioUrl,
  content,
  courseType,
  isEnrolled,
}: {
  coverUrl: string;
  title: string;
  videoUrl?: string;
  audioUrl?: string;
  content?: string;
  courseType: "video" | "audio" | "text";
  isEnrolled: boolean;
}) {
  const [mediaType, setMediaType] = useState<MediaType>("cover");
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const showControls = isEnrolled;

  const toggleMedia = () => {
    if (!showControls) {
      toast.error("You need to enroll to access this content.");
      return;
    }

    if (courseType === "video" && videoUrl) {
      setMediaType((prev) => (prev === "cover" ? "video" : "cover"));
    } else if (courseType === "audio" && audioUrl) {
      setMediaType((prev) => (prev === "cover" ? "audio" : "cover"));
    } else if (courseType === "text" && content) {
      setMediaType((prev) => (prev === "cover" ? "text" : "cover"));
    }
  };

  const getMediaUrl = (
    url: string | undefined,
    type: "videos" | "audios" | "covers"
  ) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${projectUrl}/storage/v1/object/public/${type}/${url}`;
  };

  const handlePlay = () => {
    videoRef.current?.play();
    setIsPlaying(true);
  };

  const handlePause = () => {
    videoRef.current?.pause();
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  return (
    <div className="relative w-full mb-8 rounded-xl overflow-hidden shadow-lg group">
      {mediaType === "video" && videoUrl ? (
        <div className="relative bg-black rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            controls={isPlaying}
            className="w-full aspect-video"
            onClick={(e) => {
              e.stopPropagation();
              togglePlayPause();
            }}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handlePause}
          >
            <source src={getMediaUrl(videoUrl, "videos")} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Custom controls overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Button
                variant="ghost"
                size="lg"
                className="rounded-full p-3 h-16 w-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay();
                }}
              >
                <Play className="h-8 w-8 fill-white text-white" />
              </Button>
            </div>
          )}

          {/* Custom pause button when playing */}
          {isPlaying && !videoRef.current?.controls && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="lg"
                className="rounded-full p-3 h-16 w-16 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePause();
                }}
              >
                <Pause className="h-8 w-8 fill-white text-white" />
              </Button>
            </div>
          )}
        </div>
      ) : mediaType === "audio" && audioUrl ? (
        <div
          className="flex flex-col items-center justify-center h-64 w-full bg-gradient-to-br from-gray-900 to-black text-white rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="h-5 w-5 text-gray-400" />
            <p className="text-sm font-medium text-gray-300">
              Now playing: {title}
            </p>
          </div>
          <audio
            controls
            className="w-full max-w-md bg-gray-800 rounded-full overflow-hidden"
          >
            <source src={getMediaUrl(audioUrl, "audios")} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : mediaType === "text" && content ? (
        <div
          className="p-6 overflow-y-auto max-h-[500px] bg-white text-gray-800 rounded-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <div
          className="relative w-full aspect-video cursor-pointer"
          onClick={toggleMedia}
        >
          <Image
            src={getMediaUrl(coverUrl, "covers")}
            alt={title}
            fill
            className={cn(
              "object-cover transition-all duration-300",
              showControls ? "group-hover:brightness-90" : ""
            )}
          />
          {showControls && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity opacity-0 group-hover:opacity-100">
              <div className="flex items-center gap-2 bg-black/70 text-white px-4 py-2 rounded-full">
                <Play className="h-4 w-4" />
                <span className="text-sm font-medium">Play {courseType}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
