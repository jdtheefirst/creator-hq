-- Create blogs table
create table blogs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  excerpt text,
  content text not null,
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
  vip boolean default false,
);

-- Create index for faster queries
create index blogs_status_idx on blogs(status);
create index blogs_category_idx on blogs(category);
create index blogs_creator_id_idx on blogs(creator_id);

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