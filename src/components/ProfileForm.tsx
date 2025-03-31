"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { ColorPicker } from "@/components/ui/ColorPicker";

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
    "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  store: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  vip: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  podcast:
    "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z",
  course:
    "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  music:
    "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3",
};

export default function ProfileForm({
  initialData,
  isCreator,
  userId,
}: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload avatar if changed
      if (avatarFile) {
        const { data: avatarData, error: avatarError } = await supabase.storage
          .from("avatars")
          .upload(`${userId}/${Date.now()}-avatar.jpg`, avatarFile);

        if (avatarError) throw avatarError;
        formData.avatar_url = avatarData.path;
      }

      // Upload cover if changed
      if (coverFile) {
        const { data: coverData, error: coverError } = await supabase.storage
          .from("covers")
          .upload(`${userId}/${Date.now()}-cover.jpg`, coverFile);

        if (coverError) throw coverError;
        formData.cover_image = coverData.path;
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", userId);

      if (error) throw error;

      router.refresh();
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.split(",").map((item) => item.trim()),
    }));
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "cover"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "avatar") {
        setAvatarFile(file);
      } else {
        setCoverFile(file);
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

  const addFeaturedContent = () => {
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
  };

  return (
    <div className="space-y-6">
      {/* Preview Mode Toggle */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          {previewMode ? "Edit Mode" : "Preview Mode"}
        </button>
      </div>

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
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
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
          {/* Profile Tab */}
          <TabPanel>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Image */}
              <div className="relative h-48 w-full overflow-hidden rounded-lg">
                {formData.cover_image ? (
                  <Image
                    src={formData.cover_image}
                    alt="Cover"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-200" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "cover")}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>

              {/* Avatar */}
              <div className="relative -mt-16 ml-6">
                <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white">
                  {formData.avatar_url ? (
                    <Image
                      src={formData.avatar_url}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "avatar")}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </div>

              {/* Basic Information */}
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Social Links</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Following Count
                  </label>
                  <input
                    type="number"
                    name="social_following_count"
                    value={formData.social_following_count || 0}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {Object.entries(formData.social_links || {}).map(
                  ([platform, url]) => (
                    <div key={platform}>
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {platform}
                      </label>
                      <input
                        type="url"
                        name={`social_links.${platform}`}
                        value={url}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            social_links: {
                              ...prev.social_links,
                              [platform]: e.target.value,
                            },
                          }))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  )
                )}
              </div>
            </form>
          </TabPanel>

          {/* Creator Settings Tab */}
          {isCreator && (
            <TabPanel>
              <div className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Creator Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tagline
                    </label>
                    <input
                      type="text"
                      name="tagline"
                      value={formData.tagline || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

                {/* Monetization Links */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Monetization Links</h2>
                  {Object.entries(formData.monetization_links || {}).map(
                    ([platform, url]) => (
                      <div key={platform}>
                        <label className="block text-sm font-medium text-gray-700 capitalize">
                          {platform}
                        </label>
                        <input
                          type="url"
                          name={`monetization_links.${platform}`}
                          value={url}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              monetization_links: {
                                ...prev.monetization_links,
                                [platform]: e.target.value,
                              },
                            }))
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    )
                  )}
                </div>

                {/* Featured Content */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Featured Content</h2>
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
                                // Handle thumbnail upload
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

                {/* Branding Colors */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Branding Colors</h2>
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

                {/* Booking Settings */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Booking Settings</h2>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="booking_enabled"
                      checked={formData.booking_enabled}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Enable booking form
                    </label>
                  </div>
                </div>

                {/* Quick Links Section */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Quick Links</h2>
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

                {/* Newsletter Section */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">
                    Newsletter Management
                  </h2>

                  {/* Subscriber Stats */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-500">
                        Total Subscribers
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {formData.newsletter_analytics?.total_subscribers || 0}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-500">
                        Active Subscribers
                      </div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {formData.newsletter_analytics?.active_subscribers || 0}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-500">Open Rate</div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {formData.newsletter_analytics?.open_rate || 0}%
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-500">Click Rate</div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {formData.newsletter_analytics?.click_rate || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Newsletter Preferences */}
                  <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                    <h3 className="text-md font-medium text-gray-900">
                      Newsletter Preferences
                    </h3>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Frequency
                      </label>
                      <select
                        value={
                          formData.newsletter_preferences?.email_frequency ||
                          "weekly"
                        }
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            newsletter_preferences: {
                              ...prev.newsletter_preferences,
                              email_frequency: e.target
                                .value as NewsletterPreferences["email_frequency"],
                            },
                          }));
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Welcome Email
                      </label>
                      <div className="mt-1 flex items-center">
                        <input
                          type="checkbox"
                          checked={
                            formData.newsletter_preferences?.welcome_email ||
                            false
                          }
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              newsletter_preferences: {
                                ...prev.newsletter_preferences,
                                welcome_email: e.target.checked,
                              },
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                          Send welcome email to new subscribers
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Subscriber Benefits
                      </label>
                      <div className="mt-2 space-y-2">
                        {formData.newsletter_preferences?.subscriber_benefits?.map(
                          (benefit, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <input
                                type="text"
                                value={benefit}
                                onChange={(e) => {
                                  const newBenefits = [
                                    ...(formData.newsletter_preferences
                                      ?.subscriber_benefits || []),
                                  ];
                                  newBenefits[index] = e.target.value;
                                  setFormData((prev) => ({
                                    ...prev,
                                    newsletter_preferences: {
                                      ...prev.newsletter_preferences,
                                      subscriber_benefits: newBenefits,
                                    },
                                  }));
                                }}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Enter benefit"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newBenefits =
                                    formData.newsletter_preferences?.subscriber_benefits.filter(
                                      (_, i) => i !== index
                                    );
                                  setFormData((prev) => ({
                                    ...prev,
                                    newsletter_preferences: {
                                      ...prev.newsletter_preferences,
                                      subscriber_benefits: newBenefits,
                                    },
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
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              newsletter_preferences: {
                                ...prev.newsletter_preferences,
                                subscriber_benefits: [
                                  ...(prev.newsletter_preferences
                                    ?.subscriber_benefits || []),
                                  "",
                                ],
                              },
                            }));
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Add Benefit
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email Template
                      </label>
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          value={
                            formData.newsletter_preferences?.email_template
                              ?.subject_line || ""
                          }
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              newsletter_preferences: {
                                ...prev.newsletter_preferences,
                                email_template: {
                                  ...prev.newsletter_preferences
                                    ?.email_template,
                                  subject_line: e.target.value,
                                },
                              },
                            }));
                          }}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Default subject line"
                        />
                        <textarea
                          value={
                            formData.newsletter_preferences?.email_template
                              ?.preview_text || ""
                          }
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              newsletter_preferences: {
                                ...prev.newsletter_preferences,
                                email_template: {
                                  ...prev.newsletter_preferences
                                    ?.email_template,
                                  preview_text: e.target.value,
                                },
                              },
                            }));
                          }}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          placeholder="Preview text"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Export Subscribers */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-md font-medium text-gray-900 mb-4">
                      Export Subscribers
                    </h3>
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg
                        className="h-5 w-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Export CSV
                    </button>
                  </div>
                </div>
              </div>
            </TabPanel>
          )}

          {/* Account Tab */}
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  />
                  <label className="ml-2 block text-sm text-gray-700">
                    Enable 2FA
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Account Actions</h2>
                <div className="space-y-2">
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

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
