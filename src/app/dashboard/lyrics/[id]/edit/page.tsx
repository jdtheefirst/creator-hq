import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LyricsForm from "@/components/LyricsForm";

export default async function EditLyricsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { id } = await params;
  const { data: lyric, error } = await supabase
    .from("lyrics")
    .select("*")
    .eq("id", id)
    .single();

  if (!lyric || error) notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Lyrics Studio</h1>
        <LyricsForm initialData={lyric} mode="edit" />
      </div>
    </div>
  );
}
