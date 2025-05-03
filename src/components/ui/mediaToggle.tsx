"use client";

import { useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

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

  const showControls = isEnrolled;

  const toggleMedia = () => {
    if (!showControls) return;

    if (courseType === "video" && videoUrl) {
      setMediaType((prev) => (prev === "cover" ? "video" : "cover"));
    } else if (courseType === "audio" && audioUrl) {
      setMediaType((prev) => (prev === "cover" ? "audio" : "cover"));
    } else if (courseType === "text" && content) {
      setMediaType((prev) => (prev === "cover" ? "text" : "cover"));
    }
  };

  return (
    <div
      className="relative w-full min-h-64 mb-8 rounded-xl overflow-hidden shadow-md cursor-pointer group"
      onClick={toggleMedia}
    >
      {mediaType === "video" && videoUrl ? (
        <video
          controls
          className="w-full h-64 object-cover"
          onClick={(e) => e.stopPropagation()}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : mediaType === "audio" && audioUrl ? (
        <div
          className="flex flex-col items-center justify-center h-64 w-full bg-gray-900 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="mb-2 text-sm text-gray-300">Now playing: {title}</p>
          <audio controls className="w-full px-4">
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      ) : mediaType === "text" && content ? (
        <div
          className="p-4 overflow-y-auto max-h-[400px] bg-white text-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      ) : (
        <>
          <Image
            src={coverUrl}
            alt={title}
            fill
            className="object-cover group-hover:opacity-80 transition"
          />
          {showControls && (
            <div className="absolute bottom-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              Click to view {courseType}
            </div>
          )}
        </>
      )}
    </div>
  );
}
