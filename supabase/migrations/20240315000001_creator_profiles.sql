-- Ensure 'lyrics' is part of content types
CREATE TABLE public.featured_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('blog', 'product', 'video', 'vip', 'podcast', 'course', 'lyrics')),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  url TEXT NOT NULL,
  is_vip BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.featured_content
ADD CONSTRAINT unique_creator_url UNIQUE (creator_id, url);

-- Table: waitlist_signups
create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.waitlist_signups enable row level security;
CREATE INDEX idx_waitlist_signups_id ON public.waitlist_signups(id);
CREATE INDEX idx_waitlist_signups_email ON public.waitlist_signups(email);
ALTER TABLE public.waitlist_signups
ADD CONSTRAINT waitlist_signups_email_unique UNIQUE (email);

CREATE OR REPLACE FUNCTION public.join_waitlist(p_email text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  INSERT INTO waitlist_signups (email) 
  VALUES (p_email)
  ON CONFLICT ON CONSTRAINT waitlist_signups_email_unique DO NOTHING;
  
  IF FOUND THEN
    result := jsonb_build_object(
      'status', 'success',
      'message', 'Added to waitlist!',
      'isNew', true
    );
  ELSE
    result := jsonb_build_object(
      'status', 'success',
      'message', 'You were already on the list!',
      'isNew', false
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search & Filters (Indexes for fast filtering)
CREATE INDEX idx_featured_content_type ON public.featured_content(type);
CREATE INDEX idx_featured_content_created_at ON public.featured_content(created_at DESC);
CREATE INDEX idx_featured_content_creator_id ON public.featured_content(creator_id);

create or replace function feature_content(
  _creator_id uuid,
  _type text,
  _title text,
  _description text,
  _thumbnail_url text,
  _url text,
  _is_vip boolean
)
returns void
language plpgsql
as $$
begin
  insert into featured_content (
    creator_id,
    type,
    title,
    description,
    thumbnail_url,
    url,
    is_vip
  )
  values (
    _creator_id,
    _type,
    _title,
    _description,
    _thumbnail_url,
    _url,
    _is_vip
  )
  on conflict (creator_id, url) do update
  set
    title = excluded.title,
    description = excluded.description,
    thumbnail_url = excluded.thumbnail_url,
    is_vip = excluded.is_vip,
    updated_at = timezone('utc', now());
end;
$$;

-- Corrected likes table
CREATE TABLE public.likes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,  -- Only one reference
  post_id UUID NOT NULL,
  post_type TEXT CHECK (post_type IN ('blog', 'product', 'video', 'podcast', 'course', 'lyrics')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (user_id, post_id, post_type)
);


-- Comments Table (Nested Replies & Moderation)
CREATE TABLE public.comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  creator_id TEXT NOT NULL, -- Creator of the content being commented on
  post_id UUID NOT NULL,
  post_type TEXT CHECK (post_type IN ('blog', 'product', 'video', 'podcast', 'course', 'lyrics')),
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- Nested replies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_approved BOOLEAN DEFAULT false
);
ALTER TABLE public.comments
ADD CONSTRAINT fk_comments_author_profile
FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view comments" 
  ON public.comments FOR SELECT 
  USING (true);

CREATE POLICY "Authors and Creators can manage comments"
  ON public.comments FOR ALL 
  USING (
    auth.uid() = author_id OR auth.uid() = creator_id
  )
  WITH CHECK (
    auth.uid() = author_id OR auth.uid() = creator_id
  );

CREATE INDEX comments_post_id_idx ON public.comments(post_id);
CREATE INDEX comments_post_type_idx ON public.comments(post_type);
CREATE INDEX comments_parent_id_idx ON public.comments(parent_comment_id);
CREATE INDEX comments_approved_idx ON public.comments(is_approved);
CREATE INDEX comments_created_at_idx ON public.comments(created_at);

-- Reporting System for Comments
CREATE TABLE public.comment_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reported_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'abuse', 'hate_speech', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Notifications Table
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'reply', 'follow', 'report')),
  reference_id UUID NOT NULL, -- Can point to likes, comments, follows, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_read BOOLEAN DEFAULT false
);

-- Triggers for Notifications
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, reference_id, created_at)
  SELECT f.creator_id, 'like', NEW.post_id, NOW()
  FROM public.featured_content f
  WHERE f.id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER like_notification
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION notify_on_like();

CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, reference_id, created_at)
  SELECT f.creator_id, 'comment', NEW.id, NOW()
  FROM public.featured_content f
  WHERE f.id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_notification
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

CREATE OR REPLACE FUNCTION notify_on_reply()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, reference_id, created_at)
  SELECT c.author_id, 'reply', NEW.id, NOW()
  FROM public.comments c
  WHERE c.id = NEW.parent_comment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reply_notification
AFTER INSERT ON public.comments
FOR EACH ROW EXECUTE FUNCTION notify_on_reply();

CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, reference_id, created_at)
  VALUES (NEW.following_id, 'follow', NEW.follower_id, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER follow_notification
AFTER INSERT ON public.followers
FOR EACH ROW EXECUTE FUNCTION notify_on_follow();
