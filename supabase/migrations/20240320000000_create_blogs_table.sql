-- Drop tables if they exist
DROP TABLE IF EXISTS blogs CASCADE;

-- Drop functions if they already exist
DROP FUNCTION IF EXISTS increment_blog_views(UUID);
DROP FUNCTION IF EXISTS toggle_blog_like(UUID, UUID);

-- Create blogs table
create table blogs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  excerpt text,
  content text not null,
  tags text[],
  language text,
  creator_id UUID REFERENCES auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  category text not null,
  cover_image text,
  ads_enabled boolean default false,
  status text default 'draft' check (status in ('draft', 'published')),
  views integer default 0,
  likes integer default 0,
  comments_enabled boolean default false,
  vip boolean default false
);

-- Create index for faster queries
create index blogs_status_idx on blogs(status);
create index blogs_category_idx on blogs(category);
create index blogs_creator_id_idx on blogs(creator_id);
create index blogs_vip_idx on blogs(vip);
create index blogs_created_at_idx on blogs(created_at);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$ 
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_blogs_updated_at
  before update on blogs
  for each row
  execute function update_updated_at_column();

CREATE OR REPLACE FUNCTION increment_blog_views(blog_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blogs 
  SET views = views + 1,
      updated_at = NOW()
  WHERE id = blog_id;

  INSERT INTO user_engagement (
    creator_id,
    event_type,
    page_path,
    metadata
  )
  SELECT 
    creator_id,
    'read',
    '/blogs/' || id,
    jsonb_build_object('blog_id', id, 'title', title)
  FROM blogs
  WHERE id = blog_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION toggle_blog_like(blog_id UUID, user_id UUID)
RETURNS jsonb AS $$
DECLARE
  like_exists BOOLEAN;
  current_likes INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM likes 
    WHERE post_id = blog_id 
    AND user_id = user_id 
    AND post_type = 'blog'
  ) INTO like_exists;

  IF like_exists THEN
    DELETE FROM likes 
    WHERE post_id = blog_id 
    AND user_id = user_id 
    AND post_type = 'blog';
    
    UPDATE blogs SET likes = likes - 1 WHERE id = blog_id;
  ELSE
    INSERT INTO likes (user_id, post_id, post_type)
    VALUES (user_id, blog_id, 'blog');
    
    UPDATE blogs SET likes = likes + 1 WHERE id = blog_id;
  END IF;

  SELECT likes INTO current_likes FROM blogs WHERE id = blog_id;

  RETURN jsonb_build_object(
    'likes', current_likes,
    'liked', NOT like_exists
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS and create policies
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published blogs"
  ON blogs FOR SELECT
  USING (status = 'published');

CREATE POLICY "Creators can manage their own blogs"
  ON blogs FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);