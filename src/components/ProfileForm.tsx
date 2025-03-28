import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Tab } from "@headlessui/react";
import { ColorPicker } from "@/components/ui/ColorPicker";

interface ProfileFormProps {
  initialData: {
    id: string;
    full_name: string;
    avatar_url: string;
    cover_image: string;
    bio: string;
    website: string;
    social_links: Record<string, string>;
    social_following_count: number;
    tagline: string;
    content_focus: string;
    monetization_links: Record<string, string>;
    booking_enabled: boolean;
    featured_content: Array<{
      title: string;
      url: string;
      type: string;
    }>;
    branding_colors: {
      primary: string;
      secondary: string;
    };
    contact_email?: string;
    contact_phone?: string;
    location?: string;
    timezone?: string;
    languages?: string[];
    expertise_areas?: string[];
    hourly_rate?: number;
    availability?: Record<string, any>;
  };
  isCreator: boolean;
  userId: string;
}

const contentFocusOptions = [
  "music",
  "podcast",
  "comedy",
  "fitness",
  "gaming",
  "education",
  "art",
  "photography",
  "writing",
  "other",
];

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
        { title: "", url: "", type: "video" },
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

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
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
        </Tab.List>

        <Tab.Panels className="mt-6">
          {/* Profile Tab */}
          <Tab.Panel>
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
          </Tab.Panel>

          {/* Creator Settings Tab */}
          {isCreator && (
            <Tab.Panel>
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
                  {formData.featured_content.map((content, index) => (
                    <div key={index} className="space-y-2">
                      <input
                        type="text"
                        placeholder="Title"
                        value={content.title}
                        onChange={(e) =>
                          handleFeaturedContentChange(
                            index,
                            "title",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={content.url}
                        onChange={(e) =>
                          handleFeaturedContentChange(
                            index,
                            "url",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <select
                        value={content.type}
                        onChange={(e) =>
                          handleFeaturedContentChange(
                            index,
                            "type",
                            e.target.value
                          )
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="video">Video</option>
                        <option value="article">Article</option>
                        <option value="podcast">Podcast</option>
                      </select>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeaturedContent}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Add Featured Content
                  </button>
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
              </div>
            </Tab.Panel>
          )}

          {/* Account Tab */}
          <Tab.Panel>
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
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

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
