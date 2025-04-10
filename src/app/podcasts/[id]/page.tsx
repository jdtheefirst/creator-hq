// src/app/podcasts/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface PodcastPageProps {
  params: {
    id: string;
  };
}

export default async function PodcastPage({ params }: PodcastPageProps) {
  const supabase = await createClient();
  const { data: podcast, error } = await supabase
    .from("podcasts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !podcast) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-4">{podcast.title}</h1>
        <p className="text-gray-600 mb-2">{podcast.description}</p>
        <p className="text-gray-500">
          Season {podcast.season_number}, Episode {podcast.episode_number}
        </p>
        <p className="text-gray-500">Duration: {podcast.duration} seconds</p>
        {podcast.audio_url && (
          <audio controls className="mt-4">
            <source src={podcast.audio_url} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        )}
        {podcast.cover_image_url && (
          <img
            src={podcast.cover_image_url}
            alt={`${podcast.title} cover`}
            className="mt-4 rounded-lg"
          />
        )}
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Additional Information</h2>
          {podcast.transcript && (
            <div>
              <h3 className="font-medium">Transcript</h3>
              <p>{podcast.transcript}</p>
            </div>
          )}
          {podcast.guest_name && (
            <p className="mt-2">Guest: {podcast.guest_name}</p>
          )}
          {podcast.youtube_url && (
            <p className="mt-2">
              <a
                href={podcast.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Watch on YouTube
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
