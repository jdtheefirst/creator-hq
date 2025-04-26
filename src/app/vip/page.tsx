import VipPublicPage from "@/components/vipPublicPage";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Watch my latest Video Content",
  description: "Jdtheefirst is a video creator",
  openGraph: {
    title: "Watch my latest Video Content",
    description: "Jdtheefirst is a video creator",
    url: "https://creatorhq/videos",
    type: "website",
    images: [
      {
        url: "/favicon/favicon.ico",
        width: 1200,
        height: 630,
        alt: "CreatorHQ",
      },
    ],
  },
};

export default async function VipPage() {
  const supabase = await createClient();

  const contentTypes = ["videos", "lyrics", "courses", "podcasts", "blogs"];
  const vipContent: { type: string; items: any[] }[] = [];
  const creatorId = process.env.NEXT_PUBLIC_CREATOR_UID;

  for (const type of contentTypes) {
    const { data, error } = await supabase
      .from(type)
      .select(`*`)
      .eq("vip", true)
      .eq("creator_id", creatorId);

    if (data && data.length > 0) {
      vipContent.push({ type, items: data });
    }
  }

  return (
    <div>
      <VipPublicPage vipContent={vipContent} />
    </div>
  );
}
