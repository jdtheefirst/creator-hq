import { createClient } from "@/lib/supabase/server";
import PodcastForm from "@/components/PodcastForm";

export default async function EditPodcastPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { id } = params;
  const { data: podcast } = await supabase
    .from("podcasts")
    .select("*")
    .eq("id", id)
    .single();

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Edit Podcast</h1>
      <PodcastForm initialData={podcast} mode="edit" />
    </div>
  );
}
