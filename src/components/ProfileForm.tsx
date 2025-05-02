"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { ColorPicker } from "@/components/ui/ColorPicker";
import SignOutButton from "./SignOutButton";
import { useAuth } from "@/lib/context/AuthContext";

interface BaseProfileData {
  id: string;
  full_name: string;
  avatar_url: string;
  cover_image: string;
  bio: string;
  website: string;
  social_links: Record<string, string>;
  social_following_count: number;
  contact_email?: string;
  contact_phone?: string;
  location?: string;
  timezone?: string;
  languages?: string[];
}

interface QuickLink {
  id: string;
  href: string;
  icon: string;
  title: string;
  description: string;
  color: "blue" | "red" | "green" | "yellow" | "indigo" | "teal" | "purple";
}

interface FeaturedContent {
  id: string;
  type: "blog" | "product" | "video" | "vip" | "podcast" | "course" | "lyrics";
  title: string;
  description: string;
  thumbnail_url: string;
  url: string;
  is_vip?: boolean;
}

interface NewsletterPreferences {
  welcome_email: boolean;
  subscriber_benefits: string[];
  email_frequency: "daily" | "weekly" | "monthly";
  email_template: {
    subject_line: string;
    preview_text: string;
  };
}

interface NewsletterAnalytics {
  total_subscribers: number;
  active_subscribers: number;
  open_rate: number;
  click_rate: number;
  last_sent: string;
}

interface CreatorProfileData extends BaseProfileData {
  tagline: string;
  content_focus: string;
  monetization_links: Record<string, string>;
  booking_enabled: boolean;
  featured_content: FeaturedContent[];
  follower_count: Record<string, number>;
  branding_colors: {
    primary: string;
    secondary: string;
  };
  expertise_areas?: string[];
  hourly_rate?: number;
  availability?: Record<string, any>;
  quick_links: QuickLink[];
  content_preferences: {
    preferred_content_types: string[];
    preferred_topics: string[];
    preferred_creators: string[];
    preferred_platforms: string[];
  };
  engagement_preferences: {
    preferred_engagement_types: string[];
    preferred_communication_channels: string[];
    preferred_meeting_times: string[];
    preferred_meeting_duration: string;
  };
  notification_settings: {
    email_notifications: boolean;
    push_notifications: boolean;
    booking_notifications: boolean;
    content_updates: boolean;
    engagement_alerts: boolean;
  };
  analytics_preferences: {
    track_page_views: boolean;
    track_engagement: boolean;
    track_conversions: boolean;
    share_analytics: boolean;
  };
  newsletter_preferences: NewsletterPreferences;
  newsletter_analytics: NewsletterAnalytics;
}

interface ProfileFormProps {
  initialData: CreatorProfileData;
  isCreator: boolean;
  userId: string;
}

const contentFocusOptions = [
  "blog",
  "product",
  "video",
  "vip",
  "podcast",
  "course",
  "lyrics",
];

const QUICK_LINK_ICONS = {
  blog: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15",
  video:
    "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 9h14l1 12H4L5 9z",
  store: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  vip: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  podcast:
    "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
  course:
    "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  music:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
};

type SocialPlatform =
  | "twitter"
  | "instagram"
  | "youtube"
  | "tiktok"
  | "twitch"
  | "discord"
  | "patreon"
  | "facebook"
  | "linkedin"
  | "pinterest"
  | "snapchat"
  | "telegram"
  | "vimeo";

export default function ProfileForm({
  initialData,
  isCreator,
  userId,
}: ProfileFormProps) {
  const router = useRouter();
  const { supabase } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [more, setMore] = useState(false);
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const coverUrl = `${projectUrl}/storage/v1/object/public/covers/${formData.cover_image}`;
  const avatarUrl = `${projectUrl}/storage/v1/object/public/avatars/${formData.avatar_url}`;

  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    initialData.social_links || {}
  );
  const getFileExtension = (file: File) => file.name.split(".").pop() || "jpg";
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const MONETIZATION_PLATFORMS = [
    { name: "Cash App", key: "cashapp", icon: "💵" },
    { name: "Ko-Fi", key: "kofi", icon: "☕" },
    { name: "Buy Me a Coffee", key: "buymeacoffee", icon: "🍵" },
    { name: "PayPal", key: "paypal", icon: "💰" },
    { name: "Gumroad", key: "gumroad", icon: "📦" },
    { name: "OnlyFans", key: "onlyfans", icon: "🔞" },
    { name: "Fansly", key: "fansly", icon: "🦊" },
    { name: "Venmo", key: "venmo", icon: "💸" },
    { name: "Patreon", key: "patreon", icon: "❤️" },
    { name: "Stripe", key: "stripe", icon: "🏦" },
  ];

  const [monetizationLinks, setMonetizationLinks] = useState<
    Record<string, string>
  >({
    ...Object.fromEntries(MONETIZATION_PLATFORMS.map(({ key }) => [key, ""])),
    ...(initialData.monetization_links || {}),
  });

  const defaultValues = {
    twitter: 100,
    instagram: 100,
    youtube: 100,
    tiktok: 100,
    twitch: 100,
    discord: 100,
    patreon: 100,
    facebook: 100,
    linkedin: 100,
    pinterest: 100,
    snapchat: 100,
    telegram: 100,
    vimeo: 100,
  };

  const [followerCounts, setFollowerCounts] = useState<
    Record<SocialPlatform, number>
  >(
    initialData.follower_count
      ? { ...defaultValues, ...initialData.follower_count }
      : defaultValues
  );

  const totalFollowerCount = Object.values(followerCounts).reduce(
    (acc, count) => acc + count,
    0
  );

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [avatarPreview, coverPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Delete old avatar if a new one is being uploaded
      if (avatarFile) {
        console.log("Uploading new avatar:", avatarFile);
        console.log("Avatar file name:", avatarFile.name);
        const avatarExt = getFileExtension(avatarFile);

        const { data: avatarFiles, error: avatarFetchError } =
          await supabase.storage.from("avatars").list(userId); // List existing files in user's folder

        if (avatarFetchError)
          console.error("Error fetching old avatar:", avatarFetchError);

        if ((avatarFiles ?? []).length > 0) {
          const oldAvatarPath =
            avatarFiles && avatarFiles.length > 0
              ? `${userId}/${avatarFiles[0].name}`
              : null;
          if (oldAvatarPath) {
            await supabase.storage.from("avatars").remove([oldAvatarPath]);
            console.log("Old avatar removed:", oldAvatarPath);
          }
        }

        // Upload new avatar
        const avatarPath = `${userId}/avatar.${avatarExt}`; // Overwrite with same filename
        const { data: avatarData, error: avatarError } = await supabase.storage
          .from("avatars")
          .upload(avatarPath, avatarFile, { upsert: true });

        if (avatarError) throw avatarError;
        formData.avatar_url = avatarData.path;
        console.log("New avatar uploaded:", avatarData.path);
      }

      // Delete old cover if a new one is being uploaded
      if (coverFile) {
        console.log("Uploading new cover:", coverFile);
        const coverExt = getFileExtension(coverFile);
        console.log("Cover file extension:", coverExt);
        const { data: coverFiles, error: coverFetchError } =
          await supabase.storage.from("covers").list(userId);

        if (coverFetchError)
          console.error("Error fetching old cover:", coverFetchError);

        if ((coverFiles ?? []).length > 0) {
          console.log("Old cover files:", coverFiles);
          const oldCoverPath =
            coverFiles && coverFiles.length > 0
              ? `${userId}/${coverFiles[0].name}`
              : null;
          if (oldCoverPath) {
            console.log("Removing old cover:", oldCoverPath);
            await supabase.storage.from("covers").remove([oldCoverPath]);
          }
        }

        // Upload new cover
        const coverPath = `${userId}/cover.${coverExt}`; // Overwrite with same filename
        const { data: coverData, error: coverError } = await supabase.storage
          .from("covers")
          .upload(coverPath, coverFile, { upsert: true });

        if (coverError) throw coverError;
        formData.cover_image = coverData.path;
        console.log("New cover uploaded:", coverData.path);
      }

      const updatedFollowerCounts = {
        ...(initialData.follower_count || {}),
        ...followerCounts,
      };

      const updatedSocialLinks = {
        ...(initialData.social_links || {}),
        ...socialLinks,
      };

      const updateData = {
        ...formData,
        social_links: updatedSocialLinks,
        follower_count: updatedFollowerCounts,
        social_following_count: totalFollowerCount,
        monetization_links: monetizationLinks,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;

      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    } finally {
      setLoading(false);
      setAvatarFile(null);
      setCoverFile(null);
      setAvatarPreview(null);
      setCoverPreview(null);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, checked, files } = e.target as HTMLInputElement;

    setFormData((prev) => {
      if (type === "checkbox") {
        return { ...prev, [name]: checked };
      } else if (type === "file" && files) {
        return { ...prev, [name]: files[0] };
      } else if (type === "number") {
        return { ...prev, [name]: Number(value) };
      } else if (type === "url" || type === "text" || type === "textarea") {
        return { ...prev, [name]: value };
      } else {
        try {
          return { ...prev, [name]: JSON.parse(value) };
        } catch {
          return { ...prev, [name]: value };
        }
      }
    });
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);

      if (type === "avatar") {
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarFile(file);
        setAvatarPreview(previewUrl);
      } else {
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        setCoverFile(file);
        setCoverPreview(previewUrl);
      }
    }
  };

  const handleFeaturedContentChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      featured_content: prev.featured_content.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        {isCreator ? (
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-sm rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200
          "
          >
            Dashboard
          </button>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-4 py-2 text-sm rounded-lg transition-colors bg-gray-200 text-gray-700 hover:bg-gray-300
              "
          >
            Home
          </button>
        )}

        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className={`px-4 py-2 text-sm rounded-lg transition-colors ${
            previewMode
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {previewMode ? "Preview Mode" : "Edit Mode"}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <TabGroup>
          <TabList className="flex space-x-1 rounded-xl bg-gray-100 p-1">
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                ${
                  selected
                    ? "bg-white text-blue-700 shadow"
                    : "text-gray-700 hover:bg-white/[0.12] hover:text-blue-600"
                }`
              }
            >
              Profile
            </Tab>
            {isCreator && (
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-small leading-5
                  ${
                    selected
                      ? "bg-white text-blue-700 shadow"
                      : "text-gray-700 hover:bg-white/[0.12] hover:text-blue-600"
                  }`
                }
              >
                Creator Settings
              </Tab>
            )}
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                ${
                  selected
                    ? "bg-white text-blue-700 shadow"
                    : "text-gray-700 hover:bg-white/[0.12] hover:text-blue-600"
                }`
              }
            >
              Account
            </Tab>
          </TabList>

          <TabPanels className="mt-6">
            <TabPanel className={"space-y-6"}>
              <div className="relative h-48 w-full overflow-hidden rounded-lg group">
                {/* Hidden file input */}
                <input
                  type="file"
                  id="cover-image-input"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "cover")}
                  className="hidden"
                  disabled={previewMode}
                />

                {/* Clickable image overlay */}
                {!previewMode && (
                  <label
                    htmlFor="cover-image-input"
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 cursor-pointer z-10"
                  >
                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Change Cover
                    </span>
                  </label>
                )}

                {/* Image display */}
                {coverPreview ? (
                  <Image
                    src={coverPreview}
                    alt="Cover Preview"
                    fill
                    className="object-cover"
                  />
                ) : formData.cover_image ? (
                  <Image
                    src={coverUrl}
                    alt="Cover"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200" />
                )}
              </div>

              <div className="relative -mt-16 ml-6">
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white group">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    id="avatar-image-input"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "avatar")}
                    className="hidden"
                    disabled={previewMode}
                  />

                  {/* Clickable image overlay */}
                  {!previewMode && (
                    <label
                      htmlFor="avatar-image-input"
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 cursor-pointer z-10"
                    >
                      <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
                        Change
                      </span>
                    </label>
                  )}

                  {/* Image display */}
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Avatar Preview"
                      fill
                      className="object-cover"
                    />
                  ) : formData.avatar_url ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200" />
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Basic Information</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name || ""}
                    onChange={handleChange}
                    disabled={previewMode}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 ${
                      previewMode ? "bg-gray-50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio || ""}
                    onChange={handleChange}
                    rows={4}
                    disabled={previewMode}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 ${
                      previewMode ? "bg-gray-50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website || ""}
                    onChange={handleChange}
                    disabled={previewMode}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 ${
                      previewMode ? "bg-gray-50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>
            </TabPanel>

            {isCreator && (
              <TabPanel>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold">
                      Creator Information
                    </h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tagline
                      </label>
                      <input
                        type="text"
                        name="tagline"
                        value={formData.tagline || ""}
                        onChange={handleChange}
                        disabled={previewMode}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 ${
                          previewMode ? "bg-gray-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Primary Content Focus
                      </label>
                      <select
                        name="content_focus"
                        value={formData.content_focus || ""}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                        disabled={previewMode}
                      >
                        <option value="">Select a focus area</option>
                        {contentFocusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Edit Follower Counts
                    </label>

                    <div className="flex flex-col space-y-2">
                      {[
                        { name: "X", key: "twitter", icon: "🐦" },
                        { name: "Instagram", key: "instagram", icon: "📷" },
                        { name: "YouTube", key: "youtube", icon: "▶️" },
                        { name: "TikTok", key: "tiktok", icon: "🎵" },
                        { name: "Twitch", key: "twitch", icon: "🎮" },
                        { name: "Discord", key: "discord", icon: "💬" },
                        { name: "Patreon", key: "patreon", icon: "❤️" },
                        { name: "Facebook", key: "facebook", icon: "📘" },
                        { name: "LinkedIn", key: "linkedin", icon: "💼" },
                        { name: "Pinterest", key: "pinterest", icon: "📌" },
                        { name: "Snapchat", key: "snapchat", icon: "👻" },
                        { name: "Telegram", key: "telegram", icon: "✉️" },
                        { name: "Vimeo", key: "vimeo", icon: "🎥" },
                      ]
                        .slice(0, expanded ? undefined : 1)
                        .map(({ name, key, icon }) => (
                          <div key={key} className="flex flex-col space-y-1">
                            <label className="flex items-center space-x-2 font-medium">
                              <span>{icon}</span>
                              <span>{name}:</span>
                            </label>
                            <input
                              type="url"
                              placeholder={`Enter your ${name} profile link`}
                              value={socialLinks[key] || ""}
                              onChange={(e) =>
                                setSocialLinks({
                                  ...socialLinks,
                                  [key]: e.target.value,
                                })
                              }
                              className="border rounded p-2 w-full space-x-2"
                              disabled={previewMode}
                            />
                            <input
                              type="number"
                              placeholder="Follower count"
                              value={
                                followerCounts[key as SocialPlatform] || ""
                              }
                              onChange={(e) =>
                                setFollowerCounts({
                                  ...followerCounts,
                                  [key]: Math.max(0, Number(e.target.value)),
                                })
                              }
                              className="border rounded p-2 w-full"
                              disabled={previewMode}
                            />
                          </div>
                        ))}

                      <button
                        onClick={() => setExpanded(!expanded)}
                        className="mt-2 text-blue-600 text-sm font-medium underline"
                      >
                        {expanded ? "Show Less" : "Show More"}
                      </button>
                    </div>

                    <label className="block text-sm font-medium text-gray-700">
                      Total Follower Count: {totalFollowerCount}
                    </label>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Monetization Links
                    </label>

                    <div className="flex flex-col space-y-2">
                      {MONETIZATION_PLATFORMS.slice(
                        0,
                        more ? undefined : 3
                      ).map(({ name, key, icon }) => (
                        <div key={key} className="flex flex-col space-y-1">
                          <label className="flex items-center space-x-2 font-medium">
                            <span>{icon}</span>
                            <span>{name}:</span>
                          </label>
                          <input
                            type="url"
                            placeholder={`Enter your ${name} link`}
                            value={monetizationLinks[key] || ""}
                            onChange={(e) =>
                              setMonetizationLinks({
                                ...monetizationLinks,
                                [key]: e.target.value,
                              })
                            }
                            className="border rounded p-2 w-full"
                            disabled={previewMode}
                          />
                        </div>
                      ))}

                      {MONETIZATION_PLATFORMS.length > 2 && (
                        <button
                          onClick={() => setMore(!more)}
                          className="mt-2 text-blue-600 text-sm font-medium underline"
                        >
                          {more ? "Show Less" : "Show More"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Featured Content
                    </label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {formData.featured_content.map((content, index) => (
                        <div
                          key={index}
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
                            {content.thumbnail_url ? (
                              <Image
                                src={content.thumbnail_url}
                                alt={content.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                                <svg
                                  className="h-12 w-12 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const newContent = [
                                      ...formData.featured_content,
                                    ];
                                    newContent[index] = {
                                      ...content,
                                      thumbnail_url: reader.result as string,
                                    };
                                    setFormData((prev) => ({
                                      ...prev,
                                      featured_content: newContent,
                                    }));
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 cursor-pointer opacity-0"
                              disabled={previewMode}
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <select
                                value={content.type}
                                onChange={(e) =>
                                  handleFeaturedContentChange(
                                    index,
                                    "type",
                                    e.target.value
                                  )
                                }
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border-none focus:ring-0"
                                disabled={previewMode}
                              >
                                <option value="blog">Blog</option>
                                <option value="product">Product</option>
                                <option value="video">Video</option>
                                <option value="vip">VIP</option>
                                <option value="podcast">Podcast</option>
                                <option value="course">Course</option>
                                <option value="lyrics">Lyrics</option>
                              </select>
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={content.is_vip}
                                  onChange={(e) => {
                                    const newContent = [
                                      ...formData.featured_content,
                                    ];
                                    newContent[index] = {
                                      ...content,
                                      is_vip: e.target.checked,
                                    };
                                    setFormData((prev) => ({
                                      ...prev,
                                      featured_content: newContent,
                                    }));
                                  }}
                                  className="h-4 w-4 text-yellow-500 focus:ring-yellow-500 border-gray-300 rounded"
                                  disabled={previewMode}
                                />
                                <span className="ml-2 text-xs text-gray-500">
                                  VIP
                                </span>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={content.title}
                              onChange={(e) =>
                                handleFeaturedContentChange(
                                  index,
                                  "title",
                                  e.target.value
                                )
                              }
                              className="text-lg font-medium text-gray-900 w-full bg-transparent border-none focus:ring-0 p-0 mb-1"
                              placeholder="Content Title"
                              disabled={previewMode}
                            />
                            <textarea
                              value={content.description}
                              onChange={(e) =>
                                handleFeaturedContentChange(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              className="text-sm text-gray-500 w-full bg-transparent border-none focus:ring-0 p-0 resize-none mb-4"
                              placeholder="Content Description"
                              rows={2}
                            />
                            <input
                              type="url"
                              value={content.url}
                              onChange={(e) =>
                                handleFeaturedContentChange(
                                  index,
                                  "url",
                                  e.target.value
                                )
                              }
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                              placeholder="Content URL"
                              disabled={previewMode}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newContent =
                                  formData.featured_content.filter(
                                    (_, i) => i !== index
                                  );
                                setFormData((prev) => ({
                                  ...prev,
                                  featured_content: newContent,
                                }));
                              }}
                              className="mt-2 text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove Content
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            featured_content: [
                              ...prev.featured_content,
                              {
                                id: Date.now().toString(),
                                type: "video",
                                title: "",
                                description: "",
                                thumbnail_url: "",
                                url: "",
                                is_vip: false,
                              },
                            ],
                          }));
                        }}
                        className="relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border-2 border-dashed border-gray-300 flex items-center justify-center"
                      >
                        <div className="text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Add Featured Content
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Branding Colors
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Primary Color
                        </label>
                        <ColorPicker
                          color={formData.branding_colors.primary}
                          onChange={(color) =>
                            setFormData((prev) => ({
                              ...prev,
                              branding_colors: {
                                ...prev.branding_colors,
                                primary: color,
                              },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Secondary Color
                        </label>
                        <ColorPicker
                          color={formData.branding_colors.secondary}
                          onChange={(color) =>
                            setFormData((prev) => ({
                              ...prev,
                              branding_colors: {
                                ...prev.branding_colors,
                                secondary: color,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Booking Settings
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="booking_enabled"
                        checked={formData.booking_enabled}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={previewMode}
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Enable booking form
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Quick Links
                    </label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {formData.quick_links?.map((link, index) => (
                        <div
                          key={link.id}
                          className="relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <svg
                                className={`h-6 w-6 text-${link.color}-500`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d={link.icon}
                                />
                              </svg>
                            </div>
                            <div className="ml-4 flex-1">
                              <input
                                type="text"
                                value={link.title}
                                onChange={(e) => {
                                  const newLinks = [...formData.quick_links];
                                  newLinks[index] = {
                                    ...link,
                                    title: e.target.value,
                                  };
                                  setFormData((prev) => ({
                                    ...prev,
                                    quick_links: newLinks,
                                  }));
                                }}
                                className="text-lg font-medium text-gray-900 w-full bg-transparent border-none focus:ring-0 p-0"
                                placeholder="Link Title"
                                disabled={previewMode}
                              />
                              <textarea
                                value={link.description}
                                onChange={(e) => {
                                  const newLinks = [...formData.quick_links];
                                  newLinks[index] = {
                                    ...link,
                                    description: e.target.value,
                                  };
                                  setFormData((prev) => ({
                                    ...prev,
                                    quick_links: newLinks,
                                  }));
                                }}
                                className="text-sm text-gray-500 w-full bg-transparent border-none focus:ring-0 p-0 resize-none"
                                placeholder="Link Description"
                                rows={2}
                                disabled={previewMode}
                              />
                            </div>
                          </div>
                          <div className="mt-4 flex items-center space-x-2">
                            <input
                              type="text"
                              value={link.href}
                              onChange={(e) => {
                                const newLinks = [...formData.quick_links];
                                newLinks[index] = {
                                  ...link,
                                  href: e.target.value,
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  quick_links: newLinks,
                                }));
                              }}
                              className="flex-1 text-sm text-gray-500 bg-transparent border-none focus:ring-0 p-0"
                              placeholder="Link URL"
                              disabled={previewMode}
                            />
                            <select
                              value={link.color}
                              onChange={(e) => {
                                const newLinks = [...formData.quick_links];
                                newLinks[index] = {
                                  ...link,
                                  color: e.target.value as QuickLink["color"],
                                };
                                setFormData((prev) => ({
                                  ...prev,
                                  quick_links: newLinks,
                                }));
                              }}
                              className="text-sm text-gray-500 bg-transparent border-none focus:ring-0 p-0"
                              disabled={previewMode}
                            >
                              <option value="blue">Blue</option>
                              <option value="red">Red</option>
                              <option value="green">Green</option>
                              <option value="yellow">Yellow</option>
                              <option value="indigo">Indigo</option>
                              <option value="teal">Teal</option>
                              <option value="purple">Purple</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const newLinks = formData.quick_links.filter(
                                  (_, i) => i !== index
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  quick_links: newLinks,
                                }));
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg
                                className="h-5 w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            quick_links: [
                              ...(prev.quick_links || []),
                              {
                                id: Date.now().toString(),
                                href: "",
                                icon: QUICK_LINK_ICONS.blog,
                                title: "",
                                description: "",
                                color: "blue",
                              },
                            ],
                          }));
                        }}
                        className="relative group bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border-2 border-dashed border-gray-300 flex items-center justify-center"
                      >
                        <div className="text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Add Quick Link
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </TabPanel>
            )}

            <TabPanel>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Account Security</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      disabled={previewMode}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        previewMode ? "bg-gray-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      disabled={previewMode}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        previewMode ? "bg-gray-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      disabled={previewMode}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        previewMode ? "bg-gray-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">
                    Two-Factor Authentication
                  </h2>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={previewMode}
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Enable 2FA
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Account Actions</h2>
                  <div className="space-y-2">
                    <SignOutButton />
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      Logout from All Devices
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={loading || previewMode}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
