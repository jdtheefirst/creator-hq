"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { ColorPicker } from "@/components/ui/ColorPicker";
import SignOutButton from "./SignOutButton";
import { useAuth } from "@/lib/context/AuthContext";
import { toast } from "sonner";
import Link from "next/link";

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

export const MONETIZATION_PLATFORMS = [
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
    const toastId = toast.loading("Submitting changes...");
    try {
      // Delete old avatar if a new one is being uploaded
      if (avatarFile) {
        toast.info("Uploading new avatar", { id: toastId });
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
            toast.info("Old avatar removed", { id: toastId });
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
        toast.success("New avatar uploaded", { id: toastId });
      }

      // Delete old cover if a new one is being uploaded
      if (coverFile) {
        toast.info("Uploading new cover:", { id: toastId });
        const coverExt = getFileExtension(coverFile);
        console.log("Cover file extension:", coverExt);
        const { data: coverFiles, error: coverFetchError } =
          await supabase.storage.from("covers").list(userId);

        if (coverFetchError)
          toast.error("Error fetching old cover:", { id: toastId });

        if ((coverFiles ?? []).length > 0) {
          console.log("Old cover files:", coverFiles);
          const oldCoverPath =
            coverFiles && coverFiles.length > 0
              ? `${userId}/${coverFiles[0].name}`
              : null;
          if (oldCoverPath) {
            toast.info("Removing old cover:", { id: toastId });
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
        toast.success("New cover uploaded:", { id: toastId });
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
      toast.success("Submitting changes passed", {
        id: toastId,
      });
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        {isCreator && (
          <Link
            href="/dashboard"
            className="text-sm transition-colors text-gray-700"
          >
            Dashboard
          </Link>
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
                    sizes="(max-width: 640px) 40px, (max-width: 1024px) 50px, 60px"
                    className="object-cover"
                  />
                ) : formData.cover_image ? (
                  <Image
                    src={coverUrl}
                    alt="Cover"
                    fill
                    sizes="(max-width: 640px) 40px, (max-width: 1024px) 50px, 60px"
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
                      priority
                      sizes="(max-width: 640px) 40px, (max-width: 1024px) 50px, 60px"
                      className="object-cover rounded-full"
                    />
                  ) : formData.avatar_url ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      fill
                      priority
                      sizes="(max-width: 640px) 40px, (max-width: 1024px) 50px, 60px"
                      className="object-cover rounded-full"
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
                      disabled
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
                      disabled
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
                      disabled
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
                    {/* <button
                      type="button"
                      className="w-full px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                    >
                      Logout from All Devices
                    </button>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                      onClick={() => toast.info('Deleting account')}
                    >
                      Delete Account
                    </button> */}
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
      <Link href={"/"} className="text-sm transition-colors text-gray-700">
        Home
      </Link>
    </div>
  );
}
