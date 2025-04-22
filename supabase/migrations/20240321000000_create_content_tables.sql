-- Drop existing tables if they exist
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS podcasts CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS lyrics CASCADE;

-- Drop functions if they already exist
DROP FUNCTION IF EXISTS increment_podcast_views(UUID);
DROP FUNCTION IF EXISTS toggle_podcast_like(UUID, UUID);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  category TEXT,
  tags TEXT[],
  language TEXT,
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  source TEXT NOT NULL CHECK (source IN ('youtube', 'upload', 'vimeo', 'twitch', 'facebook', 'custom')),
  video_id TEXT,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  ads_enabled BOOLEAN DEFAULT false,
  comments_enabled BOOLEAN DEFAULT true,
  vip BOOLEAN DEFAULT false
);

-- Enable RLS and create policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published videos"
  ON videos FOR SELECT
  USING (status = 'published');

CREATE POLICY "Creators can manage their own videos"
  ON videos FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

DROP TABLE IF EXISTS podcasts;

CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  language TEXT,
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  audio_url TEXT NOT NULL,
  duration INTEGER,
  episode_number INTEGER,
  season_number INTEGER,
  cover_image_url TEXT,
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  vip BOOLEAN DEFAULT false,
  youtube_url TEXT,
  transcript TEXT,
  guest_name TEXT,
  is_published BOOLEAN DEFAULT true,
  downloadable BOOLEAN DEFAULT true,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  ratings NUMERIC(2,1) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0
);

ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published podcasts"
  ON podcasts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Creators can manage their own podcasts"
  ON podcasts FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  tags TEXT[],
  category TEXT,
  language TEXT,
  description TEXT,
  url TEXT NOT NULL,
  price DECIMAL(10,2),
  level TEXT,
  duration TEXT,
  cover_image_url TEXT,
  content TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_enabled BOOLEAN DEFAULT true,
  course_type TEXT NOT NULL CHECK (course_type IN ('video', 'audio', 'text')),
  course_format TEXT NOT NULL CHECK (course_format IN ('live', 'on-demand')),
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  vip BOOLEAN DEFAULT false
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view all courses"
  ON courses FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage their own courses"
  ON courses FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Lyrics table
CREATE TABLE lyrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  video_url TEXT,
  artist TEXT,
  genre TEXT,
  language TEXT,
  album TEXT,
  release_date DATE,
  cover_image_url TEXT,
  tags TEXT[],
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments_enabled BOOLEAN DEFAULT true,
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  vip BOOLEAN DEFAULT false
);

ALTER TABLE lyrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view lyrics"
  ON lyrics FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage their own lyrics"
  ON lyrics FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Indexes
CREATE INDEX idx_videos_creator_id ON videos(creator_id);
CREATE INDEX idx_podcasts_creator_id ON podcasts(creator_id);
CREATE INDEX idx_courses_creator_id ON courses(creator_id);
CREATE INDEX idx_lyrics_creator_id ON lyrics(creator_id);
CREATE INDEX idx_lyrics_vip ON lyrics(vip);
CREATE INDEX idx_podcasts_vip ON podcasts(vip);
CREATE INDEX idx_videos_vip ON videos(vip);
CREATE INDEX idx_courses_vip ON courses(vip);

-- Podcast views function
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

-- Podcast like toggle function
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
