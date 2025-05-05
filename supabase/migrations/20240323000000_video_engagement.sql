-- Add functions for video engagement
CREATE OR REPLACE FUNCTION increment_video_views(video_id UUID, viewer_id UUID DEFAULT NULL)
RETURNS void AS $$
DECLARE
  already_viewed BOOLEAN := FALSE;
  video_creator_id UUID;
BEGIN
  -- Get video creator first
  SELECT creator_id INTO video_creator_id FROM videos WHERE id = video_id;
  
  -- Optional: only check if user_id is passed
  IF viewer_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM user_engagement
      WHERE metadata->>'video_id' = video_id::text
      AND event_type = 'view'
      AND creator_id = viewer_id
      AND created_at > (NOW() - INTERVAL '24 hours')  -- Only count once per 24 hours
    ) INTO already_viewed;
  END IF;

  -- Only track + increment if not already viewed
  IF NOT already_viewed THEN
    UPDATE videos 
    SET views = views + 1,
        updated_at = NOW()
    WHERE id = video_id;

    -- Track view in engagement table if user is logged in
    IF viewer_id IS NOT NULL THEN
      INSERT INTO user_engagement (
        creator_id,
        event_type,
        page_path,
        metadata
      ) VALUES (
        viewer_id,
        'view',
        '/videos/' || video_id,
        jsonb_build_object(
          'video_id', video_id,
          'video_creator_id', video_creator_id,
          'title', (SELECT title FROM videos WHERE id = video_id)
        )
      );
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function for video likes
CREATE OR REPLACE FUNCTION toggle_video_like(video_id UUID, user_id UUID)
RETURNS jsonb AS $$
DECLARE
  like_exists BOOLEAN;
  current_likes INTEGER;
  video_creator_id UUID;
BEGIN
  -- Get video creator first
  SELECT creator_id INTO video_creator_id FROM videos WHERE id = video_id;
  
  -- Check if like exists
  SELECT EXISTS (
    SELECT 1 FROM likes 
    WHERE post_id = video_id 
    AND likes.user_id = user_id 
    AND post_type = 'video'
  ) INTO like_exists;

  IF like_exists THEN
    DELETE FROM likes 
    WHERE post_id = video_id 
    AND likes.user_id = user_id 
    AND post_type = 'video';
    
    UPDATE videos SET likes = GREATEST(0, likes - 1) WHERE id = video_id;
    
    -- Remove like from engagement
    DELETE FROM user_engagement
    WHERE creator_id = user_id
    AND event_type = 'like'
    AND metadata->>'video_id' = video_id::text;
  ELSE
    INSERT INTO likes (user_id, post_id, post_type)
    VALUES (user_id, video_id, 'video');
    
    UPDATE videos SET likes = likes + 1 WHERE id = video_id;
    
    -- Track like in engagement table
    INSERT INTO user_engagement (
      creator_id,
      event_type,
      page_path,
      metadata
    ) VALUES (
      user_id,
      'like',
      '/videos/' || video_id,
      jsonb_build_object(
        'video_id', video_id,
        'video_creator_id', video_creator_id,
        'title', (SELECT title FROM videos WHERE id = video_id)
      )
    );
  END IF;

  SELECT likes INTO current_likes FROM videos WHERE id = video_id;

  RETURN jsonb_build_object(
    'likes', current_likes,
    'liked', NOT like_exists
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;