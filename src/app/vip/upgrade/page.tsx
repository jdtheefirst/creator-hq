import { Metadata } from "next";
import { Lock, Star, BadgeCheck, Flame, Heart } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Become a VIP Member",
  description:
    "Unlock exclusive behind-the-scenes content, unreleased projects and more",
};

const perks = [
  {
    icon: <Star className="w-6 h-6 text-yellow-400" />,
    title: "Exclusive Drops",
    description:
      "Access unreleased music, videos, and behind-the-scenes content before anyone else.",
  },
  {
    icon: <BadgeCheck className="w-6 h-6 text-green-400" />,
    title: "Priority Access",
    description:
      "Be the first to book, ask questions, or get personalized shoutouts.",
  },
  {
    icon: <Flame className="w-6 h-6 text-red-500" />,
    title: "Private Vault",
    description:
      "Content that never sees the light of day unless you're VIP. No cap.",
  },
  {
    icon: <Heart className="w-6 h-6 text-pink-500" />,
    title: "Support the Mission",
    description:
      "You’re fueling the movement. VIPs keep this whole thing alive.",
  },
];

export default function VipUpgradePage() {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-bold mb-4"
        >
          You’re one step away from the 🔥
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-neutral-400 text-lg mb-8"
        >
          Unlock the vault and get closer to the creator. This ain’t
          surface-level.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="grid sm:grid-cols-2 gap-6 text-left"
        >
          {perks.map((perk, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-md"
            >
              <div className="flex items-center gap-3 mb-3">
                {perk.icon}
                <span className="font-semibold text-lg">{perk.title}</span>
              </div>
              <p className="text-sm text-neutral-400">{perk.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12"
        >
          <Link
            href="/api/checkout/vip"
            className="inline-flex items-center gap-2 bg-yellow-400 text-black font-semibold px-6 py-3 rounded-full text-lg hover:bg-yellow-300 transition"
          >
            <Lock className="w-5 h-5" /> Become a VIP Now
          </Link>
          <p className="text-sm text-neutral-500 mt-2">
            One-time payment. Lifetime flex. 🔐
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 text-neutral-400 border-t border-neutral-800 pt-8"
        >
          <p className="text-md italic">
            "I built this for the real ones. The ones who show up. The ones who
            ride. This VIP isn’t just perks—it’s access to the unfiltered,
            uncensored, real me. If you know, you know."
          </p>
          <p className="mt-2 font-bold text-white">— jdtheefirst</p>
        </motion.div>
      </div>
    </div>
  );
}
