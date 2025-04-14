"use client";

import { useState } from "react";

interface VideoPlayerProps {
  url: string;
  source: "youtube" | "upload" | "vimeo" | "twitch" | "facebook" | "custom";
  videoId?: string;
  thumbnailUrl: string;
}

export default function VideoPlayer({
  url,
  source,
  videoId,
  thumbnailUrl,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(source === "upload");
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const renderEmbed = () => {
    let embedUrl = "";
    switch (source) {
      case "youtube":
        embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        break;
      case "vimeo":
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
        break;
      case "twitch":
        embedUrl = `https://player.twitch.tv/?video=${videoId}&parent=yourdomain.com`;
        break;
      case "facebook":
        embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
          url
        )}&show_text=0&autoplay=0`;
        break;
      case "custom":
        embedUrl = url;
        break;
      default:
        embedUrl = "";
    }

    return embedUrl ? (
      <div className="relative aspect-video">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
            <div className="text-white text-sm animate-pulse">
              Loading video...
            </div>
          </div>
        )}
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          onLoad={() => setIframeLoaded(true)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
        {["facebook", "twitch", "custom"].includes(source) && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 underline mt-2 block"
          >
            Watch on original platform
          </a>
        )}
      </div>
    ) : (
      <p className="text-red-500 text-sm mt-2">Unsupported video source</p>
    );
  };

  return (
    <div className="w-full">
      {!isPlaying ? (
        <div
          className="relative aspect-video cursor-pointer group"
          onClick={handlePlay}
        >
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/60 transition">
            <div className="bg-white rounded-full p-4 shadow-lg text-2xl">
              ▶️
            </div>
          </div>
        </div>
      ) : source === "upload" ? (
        <div className="aspect-video">
          <video
            src={url}
            poster={thumbnailUrl}
            controls
            className="w-full h-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <a
            href={url}
            download
            className="text-sm text-blue-500 underline mt-2 inline-block"
          >
            Download Video
          </a>
        </div>
      ) : (
        renderEmbed()
      )}
    </div>
  );
}
