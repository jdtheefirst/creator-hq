-- Create blogs table
create table blogs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  category text not null,
  cover_image text,
  ads_enabled boolean default false,
  status text default 'draft' check (status in ('draft', 'published')),
  author_id uuid references auth.users(id) on delete set null,
  views integer default 0,
  likes integer default 0,
  comments_enabled boolean default true
);

-- Create index for faster queries
create index blogs_slug_idx on blogs(slug);
create index blogs_status_idx on blogs(status);
create index blogs_category_idx on blogs(category);
create index blogs_author_id_idx on blogs(author_id);

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

-- Enable Row Level Security (RLS)
alter table blogs enable row level security;

-- Create policies
create policy "Public can view published blogs"
  on blogs for select
  using (status = 'published');

create policy "Authors can view their own blogs"
  on blogs for select
  using (auth.uid() = author_id);

create policy "Authors can insert their own blogs"
  on blogs for insert
  with check (auth.uid() = author_id);

create policy "Authors can update their own blogs"
  on blogs for update
  using (auth.uid() = author_id);

create policy "Authors can delete their own blogs"
  on blogs for delete
  using (auth.uid() = author_id);

-- Improve slug generation function
CREATE OR REPLACE FUNCTION generate_slug(title text)
RETURNS text AS $$
DECLARE
  slug text;
  counter integer := 0;
  base_slug text;
BEGIN
  -- Convert to lowercase and replace special characters with hyphens
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
  -- Remove leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  
  -- Initial slug attempt
  slug := base_slug;
  
  -- Check for existing slugs and append counter if needed
  WHILE EXISTS (
    SELECT 1 FROM blogs WHERE slug = slug AND 
    CASE 
      WHEN TG_OP = 'UPDATE' THEN id != NEW.id
      ELSE true
    END
  ) LOOP
    counter := counter + 1;
    slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to handle both inserts and updates
CREATE OR REPLACE FUNCTION handle_blog_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if it's not provided or title has changed
  IF NEW.slug IS NULL OR 
     (TG_OP = 'UPDATE' AND OLD.title != NEW.title AND NEW.slug = OLD.slug) THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  
  -- Ensure the slug is unique even if provided manually
  IF EXISTS (
    SELECT 1 FROM blogs 
    WHERE slug = NEW.slug AND id != NEW.id
  ) THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS generate_slug_trigger ON blogs;

-- Create new trigger
CREATE TRIGGER handle_blog_slug_trigger
  BEFORE INSERT OR UPDATE OF title, slug ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION handle_blog_slug();

-- Add function to validate slug format
CREATE OR REPLACE FUNCTION validate_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if slug matches required format
  IF NEW.slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Invalid slug format. Use only lowercase letters, numbers, and hyphens.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add validation trigger
CREATE TRIGGER validate_slug_trigger
  BEFORE INSERT OR UPDATE OF slug ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION validate_slug();

-- Add indexes for slug-related queries
CREATE INDEX IF NOT EXISTS idx_blogs_slug_status ON blogs(slug, status);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);
