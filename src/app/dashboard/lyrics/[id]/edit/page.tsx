// dashboard/lyrics/[id]/edit.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LyricsForm from "../form";

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
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-6">Edit Lyrics</h1>
      <LyricsForm initialData={lyric} userId={lyric.creator_id} />
    </div>
  );
}
