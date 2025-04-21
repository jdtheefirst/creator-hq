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
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  cover_image: string;
  follower_count: Record<string, number>;
  social_following_count: number;
  social_links: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);
  const creatorId = process.env.NEXT_PUBLIC_CREATOR_UID;

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
  const coverUrl = `https://eofyzzhfsqwfskxstczu.supabase.co/storage/v1/object/public/covers/${profile.cover_image}`;
  const avatarUrl = `https://eofyzzhfsqwfskxstczu.supabase.co/storage/v1/object/public/avatars/${profile.avatar_url}`;

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
                  className="object-cover"
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
            sizes="(max-width: 640px) 40px, (max-width: 1024px) 50px, 60px"
            fill
            priority
            className="object-cover"
          />
        )}
      </div>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end space-x-4">
              <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-white overflow-hidden flex-shrink-0">
                {profile.avatar_url ? (
                  <Image
                    src={avatarUrl}
                    alt={profile.full_name}
                    sizes="(max-width: 640px) 40px, (max-width: 1024px) 50px, 60px"
                    priority
                    fill
                    className="object-cover"
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
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
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
          <div className="mt-4 flex flex-wrap gap-4">
            {profile.social_links?.twitter && (
              <a
                href={profile.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
              >
                <span className="sr-only">Twitter</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
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
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.315 2c2.43 0 2.784.013 3.808.09 1.064.077 1.791.232 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.233.636.388 1.363.465 2.427.077 1.067.09 1.407.09 4.123v.08c0 2.643-.012 2.987-.09 4.043-.077 1.064-.232 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.233-1.363.388-2.427.465-1.067.077-1.407.09-4.123.09h-.08c-2.643 0-2.987-.012-4.043-.09-1.064-.077-1.791-.232-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.233-.636-.388-1.363-.465-2.427-.047-1.024-.09-1.379-.09-3.808v-.63c0-2.43.013-2.784.09-3.808.077-1.064.232-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.233 1.363-.388 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                    clipRule="evenodd"
                  />
                </svg>
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
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
                    clipRule="evenodd"
                  />
                </svg>
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6"
                >
                  <path d="M12 2C13.6 2 15 3.4 15 5V6.5C16.6 7.6 18.6 8 20.5 8V12C18.2 12 16 11.3 14.2 10V16C14.2 19.3 11.3 22 8 22C4.7 22 2 19.3 2 16C2 12.7 4.7 10 8 10H9V14H8C6.3 14 5 15.3 5 16.9C5 18.6 6.3 20 8 20C9.7 20 11 18.6 11 16.9V2H12Z" />
                </svg>
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
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </svg>
              </a>
            )}
            {profile.social_links?.discord && (
              <a
                href={profile.social_links.discord}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-indigo-400 transition-colors duration-200"
              >
                <span className="sr-only">Discord</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
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
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.82 2.41c3.96 0 7.18 3.24 7.18 7.21 0 3.96-3.22 7.18-7.18 7.18-3.97 0-7.21-3.22-7.21-7.18 0-3.97 3.24-7.21 7.21-7.21M2 21.6h3.5V2.41H2V21.6z" />
                </svg>
              </a>
            )}
            {profile.social_links?.website && (
              <a
                href={profile.social_links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <span className="sr-only">Website</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/blogs"
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
                  Watch my latest drops — comedy, gaming, and more
                </p>
              </div>
            </div>
            <div className="absolute bottom-2 right-4 text-xs text-red-500 group-hover:translate-x-1 transition-transform duration-300">
              Lights, camera, flex 🎥💥
            </div>
          </Link>

          <Link
            href="/store"
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
                    src={content.thumbnail_url}
                    alt={content.title}
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Stay Updated
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Subscribe to my newsletter to get the latest updates, exclusive
                content, and behind-the-scenes insights.
              </p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get("email") as string;

                  // Email validation
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(email)) {
                    setNotification({
                      message: "Please enter a valid email address",
                      type: "error",
                    });
                    return;
                  }

                  // Rate limiting (5 seconds between submissions)
                  const now = Date.now();
                  if (now - lastSubmissionTime < 5000) {
                    setNotification({
                      message: "Please wait a moment before trying again",
                      type: "info",
                    });
                    return;
                  }

                  setIsSubmitting(true);
                  try {
                    const { error } = await supabase
                      .from("newsletter_subscribers")
                      .insert([{ email }]);

                    if (error) throw error;

                    setNotification({
                      message: "Thank you for subscribing!",
                      type: "success",
                    });
                    e.currentTarget.reset();
                    setLastSubmissionTime(now);
                  } catch (error: any) {
                    if (error.code === "23505") {
                      setNotification({
                        message: "You're already subscribed!",
                        type: "info",
                      });
                    } else {
                      setNotification({
                        message: "Something went wrong. Please try again.",
                        type: "error",
                      });
                    }
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="mt-8 sm:flex justify-center"
              >
                <div className="min-w-0 flex-1">
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-md border border-gray-300 px-4 py-3 text-base placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 sm:flex-1"
                    placeholder="Enter your email"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`block w-full rounded-md border border-transparent bg-blue-600 px-4 py-3 font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:px-10 ${
                      isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                        Subscribing...
                      </div>
                    ) : (
                      "Subscribe"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
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
