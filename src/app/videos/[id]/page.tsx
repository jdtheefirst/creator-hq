import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { Play } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import VideoEngagement from "@/components/VideoEngagement";
import Comments from "@/components/Comments";

interface VideoData {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail_url: string;
  source: "youtube" | "upload";
  video_id?: string;
  status: "published";
  views: number;
  likes: number;
  creator_id: string;
  created_at: string;
}

export default async function VideoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isVipUser = false;

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("is_vip")
      .eq("id", user.id)
      .single();

    isVipUser = !!profile?.is_vip;
  }

  // Fetch video with creator details and comment count
  const { data: video, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !video) {
    notFound();
  }

  if (!isVipUser && video.vip) {
    redirect("/vip/upgrade");
  }

  // Fetch related videos by the same creator
  const { data: relatedVideos } = await supabase
    .from("videos")
    .select("*")
    .eq("creator_id", video.creator_id)
    .eq("status", "published")
    .neq("id", video.id)
    .order("created_at", { ascending: false })
    .limit(6);

  // Check if current user has liked the video
  const { data: userLike } = user
    ? await supabase
        .from("likes")
        .select("id")
        .eq("post_id", video.id)
        .eq("post_type", "video")
        .eq("user_id", user?.id)
        .single()
    : { data: null };

  // Increment view count
  const { error: incrementError } = await supabase.rpc(
    "increment_video_views",
    {
      video_id: video.id,
      viewer_id: user?.id || null,
    }
  );
  if (incrementError)
    console.error("Error incrementing views:", incrementError);

  const { data, error: commentsError } = await supabase
    .from("comments")
    .select("*, profiles(full_name, avatar_url)", { head: false })
    // .eq("creator_id", creatorId)
    .eq("post_id", video.id)
    .eq("post_type", "video")
    .order("created_at", { ascending: false })
    .limit(6);

  if (commentsError) {
    console.log("Comments Error:", commentsError);
  }

  const comments = data?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden">
              <VideoPlayer
                url={video.url}
                source={video.source}
                videoId={video.video_id}
                thumbnailUrl={video.thumbnail_url}
              />
            </div>

            {/* Video Info */}
            <div className="mt-4">
              <h1 className="text-2xl font-bold">{video.title}</h1>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-4">
                  <p className="text-sm text-gray-500">
                    {format(new Date(video.created_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{video.views.toLocaleString()} views</span>
                  <span>{video.likes.toLocaleString()} likes</span>
                </div>
              </div>

              {/* Engagement */}
              <div className="mt-4">
                <VideoEngagement
                  videoId={video.id}
                  initialLikes={video.likes}
                  initialComments={comments || 0}
                  isLiked={!!userLike}
                />
              </div>

              {/* Description */}
              <div className="mt-6 bg-white rounded-lg p-4">
                <p className="whitespace-pre-wrap">{video.description}</p>
              </div>

              {/* Comments Section */}
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Comments</h2>
                <Comments
                  postId={video.id}
                  postType="video"
                  creatorId={video.creator_id}
                  comments={data || []}
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Related Videos */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">More:</h2>
            {relatedVideos?.map((relatedVideo) => (
              <Link
                key={relatedVideo.id}
                href={`/videos/${relatedVideo.id}`}
                className="flex space-x-3 group"
              >
                <div className="relative w-40 aspect-video">
                  <img
                    src={relatedVideo.thumbnail_url}
                    alt={relatedVideo.title}
                    className="rounded-lg object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="font-medium line-clamp-2 group-hover:text-blue-600">
                    {relatedVideo.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {relatedVideo.views.toLocaleString()} views
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(relatedVideo.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
