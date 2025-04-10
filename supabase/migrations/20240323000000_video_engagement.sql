-- Add functions for video engagement
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE videos 
  SET views = views + 1,
      updated_at = NOW()
  WHERE id = video_id;
  
  -- Track in analytics
  INSERT INTO user_engagement (
    creator_id,
    event_type,
    page_path,
    metadata
  )
  SELECT 
    creator_id,
    'view',
    '/videos/' || id,
    jsonb_build_object('video_id', id, 'title', title)
  FROM videos
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function for video likes
CREATE OR REPLACE FUNCTION toggle_video_like(video_id UUID, user_id UUID)
RETURNS jsonb AS $$
DECLARE
  like_exists BOOLEAN;
  current_likes INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM likes 
    WHERE post_id = video_id 
    AND user_id = user_id 
    AND post_type = 'video'
  ) INTO like_exists;

  IF like_exists THEN
    DELETE FROM likes 
    WHERE post_id = video_id 
    AND user_id = user_id 
    AND post_type = 'video';
    
    UPDATE videos SET likes = likes - 1 WHERE id = video_id;
  ELSE
    INSERT INTO likes (user_id, post_id, post_type)
    VALUES (user_id, video_id, 'video');
    
    UPDATE videos SET likes = likes + 1 WHERE id = video_id;
  END IF;

  SELECT likes INTO current_likes FROM videos WHERE id = video_id;

  RETURN jsonb_build_object(
    'likes', current_likes,
    'liked', NOT like_exists
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
