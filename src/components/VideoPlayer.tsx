"use client";

import { useState, useEffect } from "react";

interface VideoPlayerProps {
  url: string;
  source: "youtube" | "upload";
  videoId?: string;
  thumbnailUrl: string;
}

export default function VideoPlayer({
  url,
  source,
  videoId,
  thumbnailUrl,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (source === "youtube") {
    return (
      <div className="aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video">
      <video
        src={url}
        poster={thumbnailUrl}
        controls
        className="w-full h-full"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
}
