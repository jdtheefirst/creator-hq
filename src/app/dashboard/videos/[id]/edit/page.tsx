import EditVideoClient from "@/components/EditVideoClient";
import { createClient } from "@/lib/supabase/server";

export default async function EditVideoPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = await createClient(); // your server-side Supabase client
  const { data: video, error } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !video) {
    // Redirect or handle error
    return <div>Video not found.</div>;
  }

  return <EditVideoClient video={video} />;
}
