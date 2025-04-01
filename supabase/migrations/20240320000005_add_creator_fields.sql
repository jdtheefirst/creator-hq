-- Add creator-specific fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS expertise_areas TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS availability JSONB DEFAULT '{}'::jsonb;
ADD COLUMN IF NOT EXISTS follower_counts JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS total_followers INTEGER DEFAULT 0;


-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_profiles_expertise ON public.profiles USING GIN(expertise_areas);
CREATE INDEX IF NOT EXISTS idx_profiles_languages ON public.profiles USING GIN(languages); 