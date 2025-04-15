CREATE POLICY "Creators can manage their own video files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'creator'::user_role
    )
  )
  WITH CHECK (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'creator'::user_role
    )
  );

CREATE POLICY "Public can view published video files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'videos'
    AND EXISTS (
      SELECT 1 FROM videos
      WHERE videos.url = storage.objects.name
      AND videos.status = 'published'
    )
  );

CREATE POLICY "Users can manage their own cover files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
  
CREATE POLICY "Users can manage their own avatar files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view profile cover files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'covers'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.cover_image = storage.objects.name
    )
  );

CREATE POLICY "Public can view profile avatar files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.avatar_url = storage.objects.name
    )
  );
