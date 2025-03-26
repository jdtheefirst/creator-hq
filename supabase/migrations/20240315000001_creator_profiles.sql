-- Create featured_content table
CREATE TABLE public.featured_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('blog', 'product', 'video')),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;

-- Create policies for featured_content
CREATE POLICY "Anyone can view featured content"
  ON public.featured_content FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Creators can manage their featured content"
  ON public.featured_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'creator'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'creator'
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER handle_featured_content_updated_at
  BEFORE UPDATE ON public.featured_content
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add follower count to profiles table
ALTER TABLE public.profiles
ADD COLUMN follower_count INTEGER DEFAULT 0;

-- Create followers table
CREATE TABLE public.followers (
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS for followers
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

-- Create policies for followers
CREATE POLICY "Anyone can view followers"
  ON public.followers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can follow/unfollow"
  ON public.followers FOR ALL
  TO authenticated
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- Create function to update follower count
CREATE OR REPLACE FUNCTION public.update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET follower_count = follower_count + 1
    WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles
    SET follower_count = follower_count - 1
    WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for follower count
CREATE TRIGGER update_follower_count_insert
  AFTER INSERT ON public.followers
  FOR EACH ROW EXECUTE FUNCTION public.update_follower_count();

CREATE TRIGGER update_follower_count_delete
  AFTER DELETE ON public.followers
  FOR EACH ROW EXECUTE FUNCTION public.update_follower_count(); 