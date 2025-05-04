// dashboard/lyrics/new.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LyricsForm from "@/components/LyricsForm";

export default async function NewLyricsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Lyrics Studio</h1>
        <LyricsForm mode="new" />
      </div>
    </div>
  );
}
