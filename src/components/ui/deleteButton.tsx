"use client";

import { useAuth } from "@/lib/context/AuthContext";
import { Trash2 } from "lucide-react";

export default function DeleteButton({ videoId }: { videoId: string }) {
  const { supabase } = useAuth();
  return (
    <button
      onClick={async () => {
        if (confirm("Are you sure you want to delete this video?")) {
          await supabase.from("videos").delete().eq("id", videoId);
          window.location.reload();
        }
      }}
      className="p-1 text-red-600 hover:text-red-800"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
