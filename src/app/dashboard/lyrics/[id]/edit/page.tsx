// dashboard/lyrics/[id]/edit.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LyricsForm from "@/components/LyricsForm";

interface Props {
  params: { id: string };
}

export default async function EditLyricsPage({ params }: Props) {
  const supabase = await createClient();
  const { data: lyric, error } = await supabase
    .from("lyrics")
    .select("*")
    .eq("id", params.id)
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
