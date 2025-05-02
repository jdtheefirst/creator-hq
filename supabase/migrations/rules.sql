-- videos example
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

-- Covers and Avatars
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

-- Products and Product Variants

CREATE POLICY "Creators can manage their own products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    creator_id = auth.uid()
  )
  WITH CHECK (
    creator_id = auth.uid()
  );

CREATE POLICY "Products are viewable by everyone"
  ON products
  FOR SELECT
  TO public
  USING (
   ((status)::text = 'published'::text)
  );

CREATE POLICY "Creator can manage their own variants"
ON product_variants
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_variants.product_id
    AND products.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_variants.product_id
    AND products.creator_id = auth.uid()
  )
);

CREATE POLICY "Product Variants are viewable by everyone"
ON product_variants
FOR SELECT
TO public
USING (true);

-- Audio files policy
CREATE POLICY "Creators can manage their own audio files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'audios'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'creator'
  )
)
WITH CHECK (
  bucket_id = 'audios'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'creator'
  )
);

-- Cover images policy
CREATE POLICY "Creators can manage their own cover files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'creator'
  )
)
WITH CHECK (
  bucket_id = 'covers'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'creator'
  )
);

-- Public read policies
CREATE POLICY "Public can view published audio files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'audios'
  AND EXISTS (
    SELECT 1 FROM podcasts
    WHERE podcasts.audio_url = storage.objects.name
    AND podcasts.is_published = true
  )
);

CREATE POLICY "Public can view published cover files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'covers'
  AND EXISTS (
    SELECT 1 FROM podcasts
    WHERE podcasts.cover_image_url = storage.objects.name
    AND podcasts.is_published = true
  )
);

-- courses example;
CREATE POLICY "Creators can manage their own courses files"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'courses'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'creator'::user_role
    )
  )
  WITH CHECK (
    bucket_id = 'courses'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1
      FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'creator'::user_role
    )
  );

CREATE POLICY "Public can view published course files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'courses'
    AND EXISTS (
      SELECT 1 FROM courses
      WHERE courses.status = 'published'
      AND (
        courses.audio_url = storage.objects.name
        OR courses.video_url = storage.objects.name
      )
    )
  );

