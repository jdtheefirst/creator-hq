import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { format } from "date-fns";
import { Play } from "lucide-react";
import { getEmbedUrl } from "@/lib/utils";

export default async function VideosPage() {
  const supabase = await createClient();

  // Only fetch published videos
  const { data: videos } = await supabase
    .from("videos")
    .select(
      `
      *,
      profiles:creator_id (
        full_name,
        avatar_url
      )
    `
    )
    .eq("creator_id", process.env.NEXT_PUBLIC_CREATOR_UID)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12">Videos</h1>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos?.map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Thumbnail with Play Button */}
              <div className="relative aspect-video">
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-white" />
                </div>
                {video.source === "youtube" && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-red-600 text-white">
                    YouTube
                  </div>
                )}
                {video.source === "upload" ? (
                  <video
                    src={video.url}
                    controls
                    poster={video.thumbnail_url}
                    className="w-full h-full"
                  />
                ) : (
                  <iframe
                    src={getEmbedUrl(video.source, video.video_id || video.url)}
                    className="w-full h-full"
                    allowFullScreen
                  />
                )}
              </div>

              {/* Video Info */}
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2 line-clamp-2">
                  {video.title}
                </h2>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {video.description}
                </p>

                {/* Creator Info & Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {video.profiles.avatar_url ? (
                      <img
                        src={video.profiles.avatar_url}
                        alt={video.profiles.full_name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-500">
                          {video.profiles.full_name?.[0]}
                        </span>
                      </div>
                    )}
                    <span className="text-gray-700">
                      {video.profiles.full_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-500">
                    <span>{video.views} views</span>
                    <span>•</span>
                    <span>
                      {format(new Date(video.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {(!videos || videos.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500">No videos available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
