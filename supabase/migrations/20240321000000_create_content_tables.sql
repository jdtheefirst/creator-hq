-- Videos table
CREATE OR REPLACE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  slug TEXT UNIQUE,
  source TEXT NOT NULL CHECK (source IN ('youtube', 'upload')),
  video_id TEXT, -- For YouTube videos
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  comments_enabled BOOLEAN DEFAULT true
);

-- Podcasts table
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER,
  episode_number INTEGER,
  season_number INTEGER,
  cover_image_url TEXT,
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  level TEXT,
  duration TEXT,
  cover_image_url TEXT,
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Lyrics table
CREATE TABLE lyrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  artist TEXT,
  genre TEXT,
  language TEXT,
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better query performance
CREATE INDEX idx_videos_creator_id ON videos(creator_id);
CREATE INDEX idx_podcasts_creator_id ON podcasts(creator_id);
CREATE INDEX idx_courses_creator_id ON courses(creator_id);
CREATE INDEX idx_lyrics_creator_id ON lyrics(creator_id);

-- Create function to generate video slugs
CREATE OR REPLACE FUNCTION generate_video_slug()
RETURNS TRIGGER AS $$
DECLARE
  slug text;
  counter integer := 0;
  base_slug text;
BEGIN
  -- Convert to lowercase and replace special characters with hyphens
  base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Initial slug attempt
  slug := base_slug;
  
  -- Check for existing slugs and append counter if needed
  WHILE EXISTS (
    SELECT 1 FROM videos WHERE slug = slug AND 
    CASE 
      WHEN TG_OP = 'UPDATE' THEN id != NEW.id
      ELSE true
    END
  ) LOOP
    counter := counter + 1;
    slug := base_slug || '-' || counter;
  END LOOP;
  
  -- Assign the generated slug to the NEW row
  NEW.slug := slug;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for slug generation
CREATE TRIGGER generate_video_slug_trigger
  BEFORE INSERT OR UPDATE OF title ON videos
  FOR EACH ROW
  EXECUTE FUNCTION generate_video_slug();

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view published videos"
  ON videos FOR SELECT
  USING (status = 'published');

CREATE POLICY "Creators can manage their own videos"
  ON videos FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);