import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Video, Play, Edit, Trash2 } from "lucide-react";

interface VideoData {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  status: "draft" | "published";
  source: "youtube" | "upload";
  video_id?: string;
  created_at: string;
  slug: string;
}

export default async function VideosPage() {
  const supabase = await createClient();

  const { data: videos, error } = await supabase
    .from("videos")
    .select("*")
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
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="w-12 h-12 text-white" />
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium bg-black bg-opacity-50 text-white">
                  {video.source === "youtube" ? "YouTube" : "Upload"}
                </div>
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
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      video.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {video.status}
                  </span>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/videos/${video.slug}/edit`}
                      className="p-1 text-blue-600 hover:text-blue-800"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={async () => {
                        if (
                          confirm("Are you sure you want to delete this video?")
                        ) {
                          const supabase = await createClient();
                          await supabase
                            .from("videos")
                            .delete()
                            .eq("id", video.id);
                          window.location.reload();
                        }
                      }}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
