import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";
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

export default async function VipPublicPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: userProfile } = await supabase
    .from("users")
    .select("vip")
    .eq("id", user.id)
    .single();

  const isVip = userProfile?.vip;

  const contentTypes = ["videos", "music", "courses", "podcasts", "blogs"];
  const vipContent: { type: string; items: any[] }[] = [];
  const creatorId = process.env.NEXT_PUBLIC_CREATOR_UID;

  for (const type of contentTypes) {
    const { data } = await supabase
      .from(type)
      .select("id, title, slug, thumbnail")
      .eq("vip", true)
      .eq("creator_id", creatorId);

    if (data && data.length > 0) {
      vipContent.push({ type, items: data });
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-10">VIP Vault 🔐</h1>

        {vipContent.length === 0 ? (
          <p className="text-lg text-neutral-400">
            No VIP content yet. When Content marked VIP it will show up here.
          </p>
        ) : (
          <div className="space-y-12">
            {vipContent.map((section) => (
              <div key={section.type}>
                <h2 className="text-2xl font-semibold capitalize mb-4">
                  {section.type}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {section.items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/${section.type}/${item.id}`}
                      className="relative bg-neutral-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-neutral-800"
                    >
                      {!isVip && (
                        <div
                          onClick={() => redirect("/upgrade")}
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 cursor-pointer transition hover:bg-black/70"
                        >
                          <div className="flex flex-col items-center text-white">
                            <Lock className="w-8 h-8 mb-2" />
                            <span className="text-sm font-medium">
                              Unlock with VIP
                            </span>
                          </div>
                        </div>
                      )}
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="h-48 flex items-center justify-center bg-neutral-800 text-neutral-400">
                          No Image
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-medium line-clamp-2">
                          {item.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
