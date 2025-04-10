"use client";

import { useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { Heart, Share2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface VideoEngagementProps {
  videoId: string;
  initialLikes: number;
  initialComments: number;
  isLiked: boolean;
}

export default function VideoEngagement({
  videoId,
  initialLikes,
  initialComments,
  isLiked: initialIsLiked,
}: VideoEngagementProps) {
  const { user } = useAuth();
  const { supabase } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like videos");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("toggle_video_like", {
        video_id: videoId,
        user_id: user.id,
      });

      if (error) throw error;

      setLikes(data.likes);
      setIsLiked(data.liked);
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: document.title,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying link
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="flex items-center space-x-6">
      <button
        onClick={handleLike}
        className={`flex items-center space-x-2 ${
          isLiked ? "text-red-600" : "text-gray-600 hover:text-red-600"
        }`}
      >
        <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
        <span>{likes}</span>
      </button>

      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
      >
        <MessageCircle className="w-6 h-6" />
        <span>{initialComments}</span>
      </button>

      <button
        onClick={handleShare}
        className="flex items-center space-x-2 text-gray-600 hover:text-green-600"
      >
        <Share2 className="w-6 h-6" />
        <span>Share</span>
      </button>
    </div>
  );
}
