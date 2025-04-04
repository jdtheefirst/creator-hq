-- Add video metrics table
CREATE TABLE video_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  watch_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(creator_id, date)
);

-- Enable RLS
ALTER TABLE video_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Creators can view their own video metrics"
  ON video_metrics FOR SELECT
  USING (auth.uid() = creator_id);

-- Create function to update video metrics
CREATE OR REPLACE FUNCTION update_video_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO video_metrics (
    creator_id,
    date,
    total_views,
    total_likes,
    total_comments
  )
  SELECT
    creator_id,
    CURRENT_DATE,
    SUM(views),
    SUM(likes),
    COUNT(DISTINCT c.id)
  FROM videos v
  LEFT JOIN comments c ON c.post_id = v.id AND c.post_type = 'video'
  WHERE v.creator_id = NEW.creator_id
  GROUP BY creator_id
  ON CONFLICT (creator_id, date) 
  DO UPDATE SET
    total_views = EXCLUDED.total_views,
    total_likes = EXCLUDED.total_likes,
    total_comments = EXCLUDED.total_comments,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for video metrics
CREATE TRIGGER update_video_metrics_trigger
  AFTER INSERT OR UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_video_metrics();
