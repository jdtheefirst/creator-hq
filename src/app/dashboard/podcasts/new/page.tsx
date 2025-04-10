// 1. /dashboard/podcasts/new/page.tsx
import PodcastForm from "@/components/PodcastForm";

export default function NewPodcastPage() {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Create New Podcast</h1>
      <PodcastForm mode="new" />
    </div>
  );
}
