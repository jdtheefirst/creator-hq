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
  const isVip = false;

  console.log("User:", user);

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
                  {itemsToShow.map((item: any) => (
                    <div
                      key={item.id}
                      className="relative bg-neutral-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-neutral-800"
                    >
                      {!isVip && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10 cursor-pointer hover:bg-black/70">
                              <div className="flex flex-col items-center text-white">
                                <Lock className="w-8 h-8 mb-2" />
                                <span className="text-sm font-medium">
                                  Unlock with VIP
                                </span>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent className="bg-neutral-950 text-white border border-neutral-800 rounded-xl p-6">
                            <DialogHeader>
                              <DialogTitle>Become VIP 🔥</DialogTitle>
                              <DialogDescription>
                                For just $20/one-off, you can unlock all
                                exclusive content and perks.
                              </DialogDescription>
                            </DialogHeader>

                            <p className="text-sm text-neutral-400 mb-4">
                              Get instant access to all exclusive content,
                              behind-the-scenes, and early drops.
                            </p>
                            <Link
                              href="/vip/upgrade"
                              className="inline-block bg-white text-black text-center font-bold px-4 py-2 rounded hover:bg-neutral-200 transition"
                            >
                              Upgrade Now
                            </Link>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Content Item */}
                      <Link
                        href={
                          section.type === "videos"
                            ? `/videos/${item.id}`
                            : section.type === "podcasts"
                              ? `/podcasts/${item.id}`
                              : section.type === "courses"
                                ? `/courses/${item.id}`
                                : section.type === "blogs"
                                  ? `/blogs/${item.id}`
                                  : `/lyrics/${item.id}`
                        }
                        className="block h-full"
                      >
                        {item.thumbnail_url ||
                        item.cover_image_url ||
                        item.cover_image ? (
                          <img
                            src={
                              item.thumbnail_url ||
                              item.cover_image_url ||
                              item.cover_image
                            }
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
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        <div className="absolute top-2 right-2 bg-neutral-800 text-xs text-neutral-400 px-2 py-1 rounded-full">
                          {item.tags?.join(", ")}
                        </div>
                      </Link>
                    </div>
                  ))}
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
