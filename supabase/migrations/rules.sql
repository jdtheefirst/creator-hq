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
