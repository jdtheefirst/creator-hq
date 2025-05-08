"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import Notification from "@/components/Notification";
import {
  CalendarCheck,
  Clapperboard,
  GraduationCap,
  Mic2,
  Music2,
  NotebookPen,
  ShieldUser,
  ShoppingBag,
  Star,
  UserRoundPen,
  Instagram,
  Youtube,
  Facebook,
} from "lucide-react";
import { FaVimeo, FaXTwitter } from "react-icons/fa6";
import { SiTiktok, SiTwitch } from "react-icons/si";
import NewsletterForm from "@/components/NewsletterForm";
import { getSafeUrl } from "@/lib/utils";
import { CountdownTimer } from "@/components/countdownTimer";
import { CiLinkedin } from "react-icons/ci";
import { GiSpiderWeb } from "react-icons/gi";
import { FaDiscord, FaPinterest, FaSnapchat, FaTelegram } from "react-icons/fa";
import { MONETIZATION_PLATFORMS } from "@/components/ProfileForm";

interface Profile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  cover_image: string;
  follower_count: Record<string, number>;
  social_following_count: number;
  website?: string;
  social_links: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    twitch?: string;
    discord?: string;
    patreon?: string;
    facebook?: string;
    linkedin?: string;
    pinterest?: string;
    snapchat?: string;
    telegram?: string;
    vimeo?: string;
  };
  monetization_links: {
    kofi?: string;
    cashapp?: string;
    buymeacoffee?: string;
    paypal?: string;
    gumroad?: string;
    onlyfans?: string;
    fansly?: string;
    venmo?: string;
    patreon?: string;
    stripe?: string;
  };
}

interface FeaturedContent {
  id: string;
  type: "blog" | "product" | "video" | "vip" | "podcast" | "course";
  title: string;
  description: string;
  thumbnail_url: string;
  url: string;
  is_vip?: boolean;
}

interface NotificationState {
  message: string;
  type: "success" | "error" | "info";
}

export function formatFollowers(count: number): string {
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(1) + "M";
  if (count >= 1_000) return (count / 1_000).toFixed(1) + "K";
  return count?.toString();
}

export default function CreatorProfilePage() {
  const { user, supabase } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );
  const creatorId = process.env.NEXT_PUBLIC_CREATOR_UID;
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    async function fetchProfileData() {
      try {
        if (!creatorId) {
          setLoading(false);
          return;
        }

        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*") // Get everything from profiles
          .eq("id", creatorId)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setProfile(profileData);

          // Fetch content only if profile exists
          const { data: contentData, error: contentError } = await supabase
            .from("featured_content")
            .select("*")
            .eq("creator_id", profileData.id)
            .order("created_at", { ascending: false })
            .limit(3);

          if (contentError) throw contentError;
          if (contentData) setFeaturedContent(contentData);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfileData();
  }, [creatorId, supabase]); // Empty dependency array for initial load only

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Profile Not Found
          </h1>
          <p className="mt-2 text-gray-600">
            This creator's profile is not available.
          </p>
        </div>
      </div>
    );
  }

  const coverUrl = `${projectUrl}/storage/v1/object/public/covers/${profile.cover_image}`;
  const avatarUrl = `${projectUrl}/storage/v1/object/public/avatars/${profile.avatar_url}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Icon in Top-right */}
      <div className="fixed top-4 right-4 z-50">
        {user ? (
          <details className="relative group">
            <summary className="list-none cursor-pointer h-10 w-10 rounded-full bg-white shadow-md overflow-hidden p-0 m-0">
              {profile.avatar_url ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  sizes="(max-width: 640px) 40px, (max-width: 1024px) 50px, 60px"
                  fill
                  priority
                  className="object-cover rounded-full"
                />
              ) : (
                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl text-gray-500">
                    {profile.full_name?.charAt(0)}
                  </span>
                </div>
              )}
            </summary>

            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-50">
              <Link
                href="/profile"
                rel="noopener noreferrer"
                className="flex px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                <UserRoundPen /> &nbsp; Profile
              </Link>
              {user.role === "creator" && (
                <Link
                  href="/dashboard"
                  className="flex px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  <ShieldUser /> &nbsp; Creator
                </Link>
              )}
            </div>
          </details>
        ) : (
          <Link
            href="/login"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Cover Banner */}
      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
        {profile.cover_image && (
          <Image
            src={coverUrl}
            alt="Cover"
            sizes="(min-width: 1024px) 30vw, (min-width: 768px) 33vw, 100vw"
            fill
            priority
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="relative -mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end space-x-4">
              <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-white overflow-hidden flex-shrink-0">
                {profile.avatar_url ? (
                  <Image
                    src={avatarUrl}
                    alt={profile.full_name}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                    priority
                    fill
                    className="object-cover rounded-full"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl text-gray-500">
                      {profile.full_name?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-400 truncate">
                  {profile.full_name}
                </h1>
                <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
                  {profile.bio}
                </p>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <svg
                    className="h-5 w-5 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="text-xs w-full">
                    {formatFollowers(profile.social_following_count || 200000)}{" "}
                    Followers Across
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            {profile.social_links?.twitter && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors duration-200"
              >
                <span className="sr-only">Website</span>
                <GiSpiderWeb className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.twitter && (
              <a
                href={profile.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors duration-200"
              >
                <span className="sr-only">Twitter</span>
                <FaXTwitter className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.instagram && (
              <a
                href={profile.social_links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-400 transition-colors duration-200"
              >
                <span className="sr-only">Instagram</span>
                <Instagram className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.facebook && (
              <a
                href={profile.social_links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
              >
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.youtube && (
              <a
                href={profile.social_links.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-400 transition-colors duration-200"
              >
                <span className="sr-only">YouTube</span>
                <Youtube className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.tiktok && (
              <a
                href={profile.social_links.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-black transition-colors duration-200"
              >
                <span className="sr-only">TikTok</span>
                <SiTiktok className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.twitch && (
              <a
                href={profile.social_links.twitch}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
              >
                <span className="sr-only">Twitch</span>
                <SiTwitch className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.linkedin && (
              <a
                href={profile.social_links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
              >
                <span className="sr-only">Linkedin</span>
                <CiLinkedin className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.discord && (
              <a
                href={profile.social_links.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-green-400 transition-colors duration-200"
              >
                <span className="sr-only">Discord</span>
                <FaDiscord className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.patreon && (
              <a
                href={profile.social_links.patreon}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-orange-400 transition-colors duration-200"
              >
                <span className="sr-only">Patreon</span>
                <FaDiscord className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.pinterest && (
              <a
                href={profile.social_links.pinterest}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-red-400 transition-colors duration-200"
              >
                <span className="sr-only">Pinterest</span>
                <FaPinterest className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.snapchat && (
              <a
                href={profile.social_links.snapchat}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-yellow-400 transition-colors duration-200"
              >
                <span className="sr-only">Snapchat</span>
                <FaSnapchat className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.telegram && (
              <a
                href={profile.social_links.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
              >
                <span className="sr-only">Telegram</span>
                <FaTelegram className="h-6 w-6" />
              </a>
            )}
            {profile.social_links?.vimeo && (
              <a
                href={profile.social_links.vimeo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-800 transition-colors duration-200"
              >
                <span className="sr-only">X</span>
                <FaVimeo className="h-6 w-6" />
              </a>
            )}

            {MONETIZATION_PLATFORMS.map((platform) => {
              const link =
                profile.monetization_links[
                  platform.key as keyof typeof profile.monetization_links
                ];

              if (!link) return null; // Only show if user has that platform set

              return (
                <Link
                  key={platform.key}
                  href={link}
                  passHref
                  className="w-fit h-fit p-0 rounded-full text-xl transition-all hover:text-primary"
                >
                  <span>{platform.icon}</span>
                  <span className="sr-only">{platform.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/blogs"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-100 p-6 rounded-2xl shadow transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <span className="absolute inset-0 bg-blue-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-500 text-white shadow-md group-hover:rotate-12 transition-transform duration-300 p-2">
                <NotebookPen className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                  Blog
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-700">
                  Read my latest articles: fitness, lifestyle, art, writing, and
                  more
                </p>
              </div>
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-blue-500 group-hover:translate-x-1 transition-transform duration-300">
              Wordsmith energy ✍️🔥
            </div>
          </Link>

          <Link
            href="/videos"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-100 p-6 rounded-2xl shadow transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <span className="absolute inset-0 bg-red-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500 text-white shadow-md group-hover:rotate-12 transition-transform duration-300 p-2">
                <Clapperboard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors duration-300">
                  Videos
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-700">
                  Watch my latest drops — comedy, vlogs, gaming, and more
                </p>
              </div>
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-red-500 group-hover:translate-x-1 transition-transform duration-300">
              Lights, camera, flex 🎥💥
            </div>
          </Link>

          <Link
            href="/store"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-100 p-6 rounded-2xl shadow transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <span className="absolute inset-0 bg-green-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 text-white shadow-md group-hover:rotate-12 transition-transform duration-300 p-2">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                  Store
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-700">
                  Shop my products
                </p>
              </div>
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-green-500 group-hover:translate-x-1 transition-transform duration-300">
              Real fans wear merch 🧢💸
            </div>
          </Link>

          <Link
            href="/vip"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-100 p-6 rounded-2xl shadow transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <span className="absolute inset-0 bg-yellow-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500 text-white shadow-md group-hover:rotate-12 transition-transform duration-300 p-2">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors duration-300">
                  VIP Content
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-700">
                  Exclusive content for members
                </p>
              </div>
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-yellow-500 group-hover:translate-x-1 transition-transform duration-300">
              Only the realest get in 🔐🔥
            </div>
          </Link>

          <Link
            href="/podcasts"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-100 p-6 rounded-2xl shadow transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <span className="absolute inset-0 bg-indigo-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500 text-white shadow-md group-hover:rotate-12 transition-transform duration-300 p-2">
                <Mic2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                  Podcasts
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-700">
                  Listen to my latest episodes
                </p>
              </div>
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-indigo-500 group-hover:translate-x-1 transition-transform duration-300">
              Audio gems for your brain 🧠🎧
            </div>
          </Link>

          <Link
            href="/courses"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-100 p-6 rounded-2xl shadow transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <span className="absolute inset-0 bg-teal-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-500 text-white shadow-md group-hover:rotate-12 transition-transform duration-300 p-2">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-teal-600 transition-colors duration-300">
                  Courses
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-700">
                  Learn from my courses
                </p>
              </div>
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-teal-500 group-hover:translate-x-1 transition-transform duration-300">
              Unlock knowledge, creator style 📚💡
            </div>
          </Link>

          <Link
            href="/lyrics"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-100 p-6 rounded-2xl shadow transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <span className="absolute inset-0 bg-purple-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500 text-white shadow-md group-hover:rotate-12 transition-transform duration-300 p-2">
                <Music2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                  Lyrics
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-700">
                  Dive into verses, bars & hidden gems behind your fav tracks
                </p>
              </div>
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-purple-500 italic group-hover:translate-x-1 transition-transform duration-300">
              “Every bar tells a story…” 🎤
            </div>
          </Link>

          <Link
            href="/bookme"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-100 p-6 rounded-2xl shadow transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
          >
            <span className="absolute inset-0 bg-indigo-100 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500 text-white shadow-md group-hover:rotate-12 transition-transform duration-300 p-2">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors duration-300">
                  Book Me
                </h3>
                <p className="text-sm text-gray-500 group-hover:text-gray-700">
                  1:1s, studio sessions, collabs — set the time, let's lock it
                  in
                </p>
              </div>
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-indigo-500 group-hover:translate-x-1 transition-transform duration-300">
              Let’s make it official 📆💼
            </div>
          </Link>
        </div>

        {/* Featured Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Featured Content
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredContent.map((content) => (
              <div
                key={content.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden group relative"
              >
                {content.is_vip && (
                  <div className="absolute top-2 right-2 z-10">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      VIP
                    </span>
                  </div>
                )}
                <div className="relative h-48">
                  <Image
                    src={getSafeUrl(content.thumbnail_url, content.type)}
                    alt={content.title}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {content.type?.charAt(0).toUpperCase() +
                        content.type?.slice(1)}
                    </span>
                    {content.is_vip && (
                      <svg
                        className="h-5 w-5 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    {content.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {content.description}
                  </p>
                  <Link
                    href={content.url}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View {content.type}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-gray-200">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Stay Updated
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Subscribe to my newsletter to get the latest updates, exclusive
                content, and behind-the-scenes insights.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl z-50">
          <Link
            href="/packages"
            className="bg-yellow-400 text-black px-4 py-2 rounded-full font-bold shadow-md hover:bg-yellow-300 transition text-sm text-center line-clamp-1"
          >
            🔥 One-time deal ends in{" "}
            <CountdownTimer targetDate="2025-05-20T00:00:00Z" /> – Lock Yours
          </Link>
        </div>
      </div>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
