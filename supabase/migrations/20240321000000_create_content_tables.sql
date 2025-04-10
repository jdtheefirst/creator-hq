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

ALTER TABLE podcasts
ADD COLUMN youtube_url TEXT,
ADD COLUMN transcript TEXT,
ADD COLUMN guest_name TEXT,
ADD COLUMN tags TEXT[],
ADD COLUMN is_published BOOLEAN DEFAULT true,
ADD COLUMN downloadable BOOLEAN DEFAULT true,
ADD COLUMN likes INTEGER DEFAULT 0,
ADD COLUMN views INTEGER DEFAULT 0;
ADD COLUMN ratings NUMERIC(2,1) DEFAULT 0.0,
ADD COLUMN rating_count INTEGER DEFAULT 0;

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

CREATE OR REPLACE FUNCTION increment_podcast_views(podcast_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE podcasts 
  SET views = views + 1,
      updated_at = NOW()
  WHERE id = podcast_id;
  
  INSERT INTO user_engagement (
    creator_id,
    event_type,
    page_path,
    metadata
  )
  SELECT 
    creator_id,
    'listen',
    '/podcasts/' || id,
    jsonb_build_object('podcast_id', id, 'title', title)
  FROM podcasts
  WHERE id = podcast_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_podcast_like(podcast_id UUID, user_id UUID)
RETURNS jsonb AS $$
DECLARE
  like_exists BOOLEAN;
  current_likes INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM likes 
    WHERE post_id = podcast_id 
    AND user_id = user_id 
    AND post_type = 'podcast'
  ) INTO like_exists;

  IF like_exists THEN
    DELETE FROM likes 
    WHERE post_id = podcast_id 
    AND user_id = user_id 
    AND post_type = 'podcast';
    
    UPDATE podcasts SET likes = likes - 1 WHERE id = podcast_id;
  ELSE
    INSERT INTO likes (user_id, post_id, post_type)
    VALUES (user_id, podcast_id, 'podcast');
    
    UPDATE podcasts SET likes = likes + 1 WHERE id = podcast_id;
  END IF;

  SELECT likes INTO current_likes FROM podcasts WHERE id = podcast_id;

  RETURN jsonb_build_object(
    'likes', current_likes,
    'liked', NOT like_exists
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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