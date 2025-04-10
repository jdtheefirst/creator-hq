// dashboard/lyrics/new.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LyricsForm from "./form";

export default async function NewLyricsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-6">Add New Lyrics</h1>
      <LyricsForm userId={user.id} />
    </div>
  );
}
