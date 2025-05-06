import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";

export default async function PodcastsPage() {
  const supabase = await createClient();
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const { data: podcasts, error } = await supabase
    .from("podcasts")
    .select("*")
    .eq("creator_id", process.env.NEXT_PUBLIC_CREATOR_UID)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (error) {
    return <div>Error loading podcasts: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Podcasts</h1>
          <p className="text-gray-600 mt-2">
            Explore the latest episodes from your favorite creator.
          </p>
        </div>

        {podcasts.length === 0 ? (
          <p>No podcasts available.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast) => (
              <Link
                key={podcast.id}
                href={`/podcasts/${podcast.id}`}
                className="block bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden"
              >
                {podcast.cover_image_url && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={`${projectUrl}/storage/v1/object/public/covers/${podcast.cover_image_url}`}
                      alt={`${podcast.title} cover`}
                      fill
                      sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-1 line-clamp-2">
                    {podcast.title}
                  </h2>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {podcast.description}
                  </p>
                  <div className="mt-2 text-sm text-gray-500">
                    Season {podcast.season_number}, Episode{" "}
                    {podcast.episode_number}
                    <br />
                    Duration: {podcast.duration} min
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="flex text-center text-sm text-gray-400 mt-4 gap-4">
          <p> No more pods</p>
          <a href="/" className="inline-block text-blue-500 hover:underline">
            Go back home
          </a>
        </div>
      </div>
    </div>
  );
}
