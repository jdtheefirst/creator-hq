import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function PublicLyricsPage() {
  const supabase = await createClient();
  const { data: lyrics } = await supabase
    .from("lyrics")
    .select("id, title, artist, genre, language, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold mb-12 text-center">
          Lyrics & Music Archive
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {lyrics?.map((lyric) => (
            <Link
              key={lyric.id}
              href={`/app/lyrics/${lyric.id}`}
              className="bg-white/10 hover:bg-white/20 transition rounded-2xl p-6 backdrop-blur shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-2">{lyric.title}</h2>
              <p className="text-sm text-gray-300">
                Artist: {lyric.artist || "Unknown"}
              </p>
              <p className="text-sm text-gray-300">
                Genre: {lyric.genre || "N/A"}
              </p>
              <p className="text-sm text-gray-400 italic">
                {new Date(lyric.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
