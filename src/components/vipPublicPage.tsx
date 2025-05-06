"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/context/AuthContext";
import Image from "next/image";
import { getSafeUrl } from "@/lib/utils";

interface VipItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  thumbnail_url?: string;
  cover_image_url?: string;
  cover_image?: string;
}

interface VipContentSection {
  type: string;
  items: VipItem[];
}

export default function VipPublicPage({
  vipContent,
}: {
  vipContent: VipContentSection[];
}) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const { user } = useAuth();
  const isVip = user?.is_vip || false;

  const toggleSection = (type: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Flatten all tags from all content types
  const allTags = useMemo(() => {
    const tags = vipContent.flatMap(({ items }) =>
      items.flatMap((item) => item.tags || [])
    );
    return [...new Set(tags)];
  }, [vipContent]);

  // Filter content based on selected tag
  const filteredContent = useMemo(() => {
    if (!selectedTag) return vipContent;
    return vipContent
      .map(({ type, items }) => ({
        type,
        items: items.filter((item) => item.tags?.includes(selectedTag)),
      }))
      .filter(({ items }) => items.length > 0);
  }, [selectedTag, vipContent]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Vault Title */}
          <motion.h1
            className="text-4xl font-bold text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            VIP Vault 🔐
          </motion.h1>

          {/* VIP Perks Highlight */}
          <motion.div
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-2">Why Go VIP?</h2>
            <ul className="list-disc pl-6 text-neutral-300 space-y-1 text-sm">
              <li>Behind-the-scenes videos</li>
              <li>Early access to new drops</li>
              <li>Exclusive podcast episodes</li>
              <li>Premium courses & tutorials</li>
            </ul>
          </motion.div>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <Select
            onValueChange={(val) => setSelectedTag(val === "all" ? null : val)}
            defaultValue="all"
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredContent.length === 0 ? (
          <p className="text-lg text-neutral-400">
            No VIP content yet. It’ll show up here when it’s ready.
          </p>
        ) : (
          filteredContent.map((section: any) => {
            const isExpanded = expandedSections[section.type];
            const itemsToShow = isExpanded
              ? section.items
              : section.items.slice(0, 5);

            return (
              <div key={section.type} className="mb-12">
                <h2 className="text-2xl font-semibold capitalize mb-4">
                  {section.type}{" "}
                  <span className="text-sm text-neutral-400">
                    ({section.items.length})
                  </span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {itemsToShow.map((item: any) => {
                    const imageSrc =
                      item.thumbnail_url ||
                      item.cover_image_url ||
                      item.cover_image;
                    const contentUrl =
                      section.type === "videos"
                        ? `/videos/${item.id}`
                        : section.type === "podcasts"
                          ? `/podcasts/${item.id}`
                          : section.type === "courses"
                            ? `/courses/${item.id}`
                            : section.type === "blogs"
                              ? `/blogs/${item.id}`
                              : `/lyrics/${item.id}`;

                    return (
                      <div
                        key={item.id}
                        className="relative bg-neutral-900 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-neutral-800 group"
                      >
                        {!isVip && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Lock className="w-8 h-8 mb-1" />
                                <span className="text-sm font-semibold">
                                  Unlock with VIP
                                </span>
                              </div>
                            </DialogTrigger>
                            <DialogContent className="bg-neutral-950 text-white border border-neutral-800 rounded-xl p-6">
                              <DialogHeader>
                                <DialogTitle>Become VIP 🔥</DialogTitle>
                                <DialogDescription>
                                  Just $20 once to unlock all exclusive drops &
                                  perks.
                                </DialogDescription>
                              </DialogHeader>

                              <p className="text-sm text-neutral-400 mb-4">
                                Instant access to behind-the-scenes, unreleased,
                                and early content.
                              </p>
                              <Link
                                href="/vip/upgrade"
                                className="inline-block bg-white text-black font-bold px-4 py-2 rounded hover:bg-neutral-200 transition"
                              >
                                Upgrade Now
                              </Link>
                            </DialogContent>
                          </Dialog>
                        )}

                        <Link href={contentUrl} className="block h-full">
                          <div className="relative w-full h-48">
                            {imageSrc ? (
                              <Image
                                src={getSafeUrl(imageSrc, "covers")}
                                alt={item.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 25vw"
                                priority={false}
                              />
                            ) : (
                              <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-sm">
                                No Image
                              </div>
                            )}
                          </div>

                          <div className="p-4 space-y-2">
                            <h3 className="text-base font-semibold text-white line-clamp-2">
                              {item.title}
                            </h3>
                            <p className="text-sm text-neutral-400 line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          {item.tags?.length > 0 && (
                            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 text-xs rounded-full text-white line-clamp-1">
                              {item.tags.join(", ")}
                            </div>
                          )}
                        </Link>
                      </div>
                    );
                  })}
                </div>

                {/* Show All / Show Less button */}
                {section.items.length > 5 && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => toggleSection(section.type)}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      {isExpanded ? "Show Less" : "Show All"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}

        <div className="flex-end justify-start items-center">
          <a
            href="/"
            className="inline-block text-xs text-gray-400 hover:underline"
          >
            Go back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
}
