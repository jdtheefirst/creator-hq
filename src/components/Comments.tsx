"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

interface CommentsProps {
  postId: string;
  postType: "video" | "blog" | "product";
  creatorId: string;
  comments: any[];
}

export default function Comments({
  postId,
  postType,
  creatorId,
  comments,
}: CommentsProps) {
  const { supabase, user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert([
        {
          content: newComment,
          post_id: postId,
          post_type: postType,
          author_id: user.id,
          creator_id: creatorId,
        },
      ]);

      if (error) throw error;

      setNewComment("");
      toast.success("Comment added successfully");
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
          rows={3}
          required
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        <h1 className="font-bold">Latest Comments</h1>
        {comments.map((comment) => (
          <div key={comment.id} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-3 mb-2">
              {comment.profiles.avatar_url ? (
                <img
                  src={`${projectUrl}/storage/v1/object/public/avatars/${comment.profiles.avatar_url}`}
                  alt={comment.profiles.full_name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm text-gray-500">
                    {comment.profiles.full_name?.[0]}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium">{comment.profiles.full_name}</p>
                <p className="text-sm text-gray-500">
                  {format(new Date(comment.created_at), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <p className="text-gray-700">{comment.content}</p>
          </div>
        ))}

        {comments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}
