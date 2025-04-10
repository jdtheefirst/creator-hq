// src/app/podcasts/page.tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function PodcastsPage() {
  const supabase = await createClient();
  const { data: podcasts, error } = await supabase
    .from("podcasts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div>Error loading podcasts: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">Podcasts</h1>
        {podcasts.length === 0 ? (
          <p>No podcasts available.</p>
        ) : (
          <ul className="space-y-4">
            {podcasts.map((podcast) => (
              <li key={podcast.id} className="border p-4 rounded-lg shadow">
                <h2 className="text-2xl font-semibold">
                  <Link href={`/podcasts/${podcast.id}`}>{podcast.title}</Link>
                </h2>
                <p className="text-gray-600">{podcast.description}</p>
                <p className="text-gray-500">
                  Season {podcast.season_number}, Episode{" "}
                  {podcast.episode_number}
                </p>
                <p className="text-gray-500">
                  Duration: {podcast.duration} seconds
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
