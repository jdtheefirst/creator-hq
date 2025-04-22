"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
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
  isVip,
}: {
  vipContent: VipContentSection[];
  isVip: boolean;
}) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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
          filteredContent.map((section: any) => (
            <div key={section.type}>
              <h2 className="text-2xl font-semibold capitalize mb-4">
                {section.type}{" "}
                <span className="text-sm text-neutral-400">
                  ({section.items.length})
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {section.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="relative bg-neutral-900 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all border border-neutral-800"
                    id="items"
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
                        <DialogContent
                          aria-describedby="items"
                          className="bg-neutral-950 text-white border border-neutral-800 rounded-xl p-6"
                        >
                          <DialogTitle>Become VIP 🔥</DialogTitle>
                          <p className="text-sm text-neutral-400 mb-4">
                            Get instant access to all exclusive content,
                            behind-the-scenes, and early drops.
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
                  </div>
                ))}
              </div>
            </div>
          ))
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
