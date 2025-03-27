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

-- Create function to generate slug from title
create or replace function generate_slug(title text)
returns text as $$
begin
  return lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
end;
$$ language plpgsql;

-- Create trigger to automatically generate slug
create or replace function generate_slug_trigger()
returns trigger as $$
begin
  if new.slug is null then
    new.slug := generate_slug(new.title);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger generate_slug_trigger
  before insert or update of title on blogs
  for each row
  execute function generate_slug_trigger(); 