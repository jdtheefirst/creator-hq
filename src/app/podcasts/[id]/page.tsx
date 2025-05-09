import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";

interface PodcastPageProps {
  params: {
    id: string;
  };
}

export default async function PodcastPage({ params }: PodcastPageProps) {
  const { id } = params;
  const supabase = await createClient();
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isVipUser = false;

  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("is_vip")
      .eq("id", user.id)
      .single();

    isVipUser = !!profile?.is_vip;
  }

  const { data: podcast, error } = await supabase
    .from("podcasts")
    .select("*")
    .eq("id", id)
    .eq("creator_id", process.env.NEXT_PUBLIC_CREATOR_UID)
    .single();

  if (error || !podcast) {
    console.error("Error fetching podcast:", error);
    notFound();
  }

  if (!isVipUser && podcast.vip) {
    redirect("/vip/upgrade");
  }

  const { data: otherSeasons } = await supabase
    .from("podcasts")
    .select("*")
    .eq("creator_id", process.env.NEXT_PUBLIC_CREATOR_UID)
    .neq("season_number", podcast?.season_number)
    .order("season_number", { ascending: false })
    .limit(6);

  const audioSrc = `${projectUrl}/storage/v1/object/public/audios/${podcast.audio_url}`;
  const coverSrc = `${projectUrl}/storage/v1/object/public/covers/${podcast.cover_image_url}`;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">{podcast.title}</h1>
          <p className="text-gray-600 mb-2">{podcast.description}</p>
          <p className="text-gray-500">
            Season {podcast.season_number}, Episode {podcast.episode_number}
          </p>
          <p className="text-gray-500">Duration: {podcast.duration} seconds</p>

          {podcast.audio_url && (
            <audio controls className="mt-4 w-full">
              <source src={audioSrc} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          )}

          {podcast.cover_image_url && (
            <div className="relative mt-6 w-full h-64 rounded-lg overflow-hidden">
              <Image
                src={coverSrc}
                alt={`${podcast.title} cover`}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-xl font-semibold">Additional Information</h2>
            {podcast.transcript && (
              <div className="mt-2">
                <h3 className="font-medium">Transcript</h3>
                <p className="text-gray-700 whitespace-pre-line">
                  {podcast.transcript}
                </p>
              </div>
            )}
            {podcast.guest_name && (
              <p className="mt-2 text-gray-700">Guest: {podcast.guest_name}</p>
            )}
            {podcast.youtube_url && (
              <p className="mt-2">
                <a
                  href={podcast.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Watch on YouTube
                </a>
              </p>
            )}
          </div>
        </div>

        {otherSeasons && otherSeasons.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">More Episodes</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherSeasons
                .sort((a, b) => a.season_number - b.season_number)
                .map((episode) => (
                  <a
                    key={episode.id}
                    href={`/podcasts/${episode.id}`}
                    className="block bg-white rounded-xl border border-gray-200 hover:shadow-md transition overflow-hidden"
                  >
                    {episode.cover_image_url ? (
                      <div className="relative w-full h-48">
                        <Image
                          src={`${projectUrl}/storage/v1/object/public/audios/${episode.cover_image_url}`}
                          alt={episode.title}
                          fill
                          className="object-cover"
                          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                        No Cover Image
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        {episode.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        S{episode.season_number} • E{episode.episode_number}
                      </p>
                    </div>
                  </a>
                ))}
            </div>
          </div>
        )}

        <div className="mt-10 text-center">
          <a
            href="/podcasts"
            className="inline-block text-blue-600 hover:text-blue-800 font-medium underline"
          >
            See all episodes
          </a>
        </div>
      </div>
    </div>
  );
}
