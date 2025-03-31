-- Add new fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS social_following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS content_focus TEXT,
ADD COLUMN IF NOT EXISTS monetization_links JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_content JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS branding_colors JSONB DEFAULT '{"primary": "#000000", "secondary": "#ffffff"}'::jsonb;

-- Create enum for content focus types
CREATE TYPE content_focus_type AS ENUM (
  'blog', 'product', 'video', 'vip', 'podcast', 'course', 'lyrics'
);

-- Add constraint for content_focus
ALTER TABLE public.profiles
ADD CONSTRAINT valid_content_focus 
CHECK (content_focus::text::content_focus_type IS NOT NULL);

-- Create index for content focus
CREATE INDEX IF NOT EXISTS idx_profiles_content_focus ON public.profiles(content_focus); 