import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

export default async function PublicLyricsPage() {
  const supabase = await createClient();
  const projectURL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const { data: lyrics } = await supabase
    .from("lyrics")
    .select("*")
    .eq("creator_id", process.env.NEXT_PUBLIC_CREATOR_UID) // Replace with actual user ID
    .eq("status", "published") // Only show published lyrics
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Lyrics & Music Archive
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Explore our collection of song lyrics with artist details, albums,
            and more
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {lyrics?.map((lyric) => (
            <Link
              key={lyric.id}
              href={`/lyrics/${lyric.id}`}
              className="group relative overflow-hidden rounded-xl bg-gray-800/50 hover:bg-gray-700/70 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              {/* Cover Image */}
              <div className="aspect-square relative overflow-hidden">
                {lyric.cover_image_url ? (
                  <Image
                    src={`${projectURL}/storage/v1/object/public/covers/${lyric.cover_image_url}`}
                    alt={`${lyric.title} cover`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-900 to-pink-800 flex items-center justify-center">
                    <span className="text-4xl">🎵</span>
                  </div>
                )}
              </div>

              {/* VIP Badge */}
              {lyric.vip && (
                <div className="absolute top-3 right-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-bold px-2 py-1 rounded-full">
                  VIP
                </div>
              )}

              {/* Content */}
              <div className="p-4">
                <h2 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-purple-300 transition-colors">
                  {lyric.title}
                </h2>

                <div className="flex items-center text-sm text-gray-300 mb-2">
                  <span className="line-clamp-1">
                    {lyric.artist || "Unknown Artist"}
                  </span>
                  {lyric.album && (
                    <div className="flex items-center">
                      <span className="mx-2">•</span>
                      <span className="line-clamp-1">{lyric.album}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {lyric.genre && (
                    <span className="text-xs px-2 py-1 bg-gray-700 rounded-full">
                      {lyric.genre}
                    </span>
                  )}
                  {lyric.language && (
                    <span className="text-xs px-2 py-1 bg-gray-700 rounded-full">
                      {lyric.language}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>
                    {lyric.release_date
                      ? new Date(lyric.release_date).toLocaleDateString()
                      : "Unknown date"}
                  </span>
                  <span>{lyric.views || 0} views</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {lyrics?.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-gray-400">No lyrics available yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
