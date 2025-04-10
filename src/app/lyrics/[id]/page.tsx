import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Props {
  params: { id: string };
}

export default async function LyricsDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: lyric } = await supabase
    .from("lyrics")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!lyric) notFound();

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold">{lyric.title}</h1>
        <p className="text-lg text-gray-400">
          by {lyric.artist || "Unknown Artist"}
        </p>
        <div className="text-sm text-gray-500">
          Genre: {lyric.genre} • Language: {lyric.language}
        </div>
        <div className="mt-8 text-left whitespace-pre-line bg-white/5 p-6 rounded-lg shadow-md text-lg leading-relaxed">
          {lyric.content}
        </div>
      </div>
    </div>
  );
}
