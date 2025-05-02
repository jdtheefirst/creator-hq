import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Video, Edit } from "lucide-react";
import DeleteButton from "@/components/ui/deleteButton";
import VideoPlayer from "@/components/VideoPlayer";

interface VideoData {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  status: "draft" | "published";
  source: "youtube" | "upload" | "vimeo" | "twitch" | "facebook" | "custom";
  video_id?: string;
  vip: boolean;
  comments_enabled: boolean;
  ads_enabled: boolean;
  created_at: string;
}

export default async function VideosPage() {
  const supabase = await createClient();

  const { data: videos, error } = await supabase
    .from("videos")
    .select("*")
    .eq("creator_id", process.env.NEXT_PUBLIC_CREATOR_UID)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching videos:", error);
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Videos</h1>
          <p className="text-red-600">
            Error loading videos. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Videos</h1>
          <Link
            href="/dashboard/videos/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Video className="w-4 h-4" />
            New Video
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos?.map((video: VideoData) => (
            <div
              key={video.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="relative aspect-video">
                <VideoPlayer
                  url={video.url}
                  source={video.source}
                  videoId={video.video_id}
                  thumbnailUrl={video.thumbnail_url}
                />
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 truncate">
                  {video.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {video.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-4">
                    <span>{video.views} views</span>
                    <span>{video.likes} likes</span>
                  </div>
                  <span>
                    {format(new Date(video.created_at), "MMM d, yyyy")}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status */}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        video.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {video.status}
                    </span>

                    {/* Ads */}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        video.ads_enabled
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      ads {video.ads_enabled ? "on" : "off"}
                    </span>

                    {/* Comments */}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        video.comments_enabled
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      comments {video.comments_enabled ? "on" : "off"}
                    </span>

                    {/* VIP */}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        video.vip
                          ? "bg-pink-100 text-pink-800"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {video.vip ? "VIP" : "standard"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/videos/${video.id}/edit`}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    {/* Delete Button */}
                    <DeleteButton contentType="videos" contentId={video.id} />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {videos?.length === 0 && (
            <div className="col-span-full text-center py-12">
              <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No videos yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new video.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/videos/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Video className="w-4 h-4 mr-2" />
                  New Video
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
