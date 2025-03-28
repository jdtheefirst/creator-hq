export interface ProfileFormData {
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
}

export interface ProfileFormProps {
  initialData: ProfileFormData;
  isCreator: boolean;
  userId: string;
}

export const contentFocusOptions = [
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
] as const;
