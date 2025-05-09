import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { format } from "date-fns";
import Link from "next/link";
import { getEmbedUrl } from "@/lib/utils";

interface Props {
  params: { id: string };
}

export default async function LyricsDetailPage({ params }: Props) {
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

  const { data: lyric } = await supabase
    .from("lyrics")
    .select("*")
    .eq("id", id)
    .single();

  if (!lyric) notFound();

  if (!isVipUser && lyric.vip) {
    redirect("/vip/upgrade");
  }

  // Extract YouTube ID if URL exists
  const embedUrl = getEmbedUrl(lyric.video_source, lyric.video_url || "");
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="mb-8">
          <Link
            href="/lyrics"
            className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
          >
            ← Back to all lyrics
          </Link>
        </div>

        {/* Main content */}
        <div className="space-y-8">
          {/* Title and metadata */}
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
              {lyric.title}
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              by {lyric.artist || "Unknown Artist"}
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 mb-6">
              {lyric.album && <span>Album: {lyric.album}</span>}
              {lyric.genre && <span>Genre: {lyric.genre}</span>}
              {lyric.language && <span>Language: {lyric.language}</span>}
              {lyric.release_date && (
                <span>
                  Released:{" "}
                  {format(new Date(lyric.release_date), "MMMM d, yyyy")}
                </span>
              )}
            </div>

            {lyric.vip && (
              <span className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-bold px-3 py-1 rounded-full mb-6">
                VIP Content
              </span>
            )}
          </div>

          {/* Video embed section */}
          {lyric.video_url && embedUrl ? (
            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-xl my-8">
              <iframe
                className="w-full h-full"
                src={embedUrl}
                title={`${lyric.title} video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : lyric.cover_image_url ? (
            <div className="relative aspect-square max-w-md mx-auto rounded-xl overflow-hidden shadow-xl">
              <Image
                src={`${projectUrl}/storage/v1/object/public/covers/${lyric.cover_image_url}`}
                alt={`${lyric.title} cover art`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : null}

          {/* Lyrics content */}
          <div className="bg-white/5 p-6 sm:p-8 rounded-xl shadow-md">
            <div className="prose prose-invert max-w-none whitespace-pre-line">
              {lyric.content}
            </div>
          </div>

          {/* Footer stats */}
          <div className="flex justify-between items-center text-sm text-gray-400 border-t border-gray-800 pt-4">
            <span>
              Added: {format(new Date(lyric.created_at), "MMMM d, yyyy")}
            </span>
            <div className="flex gap-4">
              <span>{lyric.views || 0} views</span>
              <span>{lyric.likes || 0} likes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
