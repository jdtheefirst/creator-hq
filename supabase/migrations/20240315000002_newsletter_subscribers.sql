-- Create newsletter_subscribers table
create table newsletter_subscribers (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  creator_id uuid references auth.users(id) on delete cascade,
  subscribed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_active boolean default true
);

-- Enable RLS
alter table newsletter_subscribers enable row level security;

-- Create policies
create policy "Anyone can subscribe to newsletter"
  on newsletter_subscribers for insert
  with check (true);

create policy "Creators can view their subscribers"
  on newsletter_subscribers for select
  using (auth.uid() = creator_id);
create policy "Creators can update their subscriber status"
  on newsletter_subscribers for update
  using (auth.uid() = creator_id);
create policy "Creators can delete their subscribers"
  on newsletter_subscribers for delete
  using (auth.uid() = creator_id);

-- Add campaigns table with RLS policies
create table newsletter_campaigns (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  subject text,
  content text,
  status text default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_for timestamp with time zone,
  sent_at timestamp with time zone,
  stats jsonb default '{"sent": 0, "opened": 0, "clicked": 0}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table newsletter_campaigns enable row level security;

-- Create policies for campaigns
create policy "Creators can view their own campaigns"
  on newsletter_campaigns for select
  using (auth.uid() = creator_id);

create policy "Creators can create their own campaigns"
  on newsletter_campaigns for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their own campaigns"
  on newsletter_campaigns for update
  using (auth.uid() = creator_id);

create policy "Creators can delete their own campaigns"
  on newsletter_campaigns for delete
  using (auth.uid() = creator_id);

-- Add campaign_logs table for tracking
create table newsletter_campaign_logs (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references newsletter_campaigns(id) on delete cascade not null,
  subscriber_id uuid references newsletter_subscribers(id) on delete cascade not null,
  event_type text not null check (event_type in ('sent', 'opened', 'clicked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  metadata jsonb default '{}'::jsonb
);

-- Enable RLS for logs
alter table newsletter_campaign_logs enable row level security;

-- Create policies for logs
create policy "Creators can view their campaign logs"
  on newsletter_campaign_logs for select
  using (
    exists (
      select 1 from newsletter_campaigns
      where id = campaign_id
      and creator_id = auth.uid()
    )
  );
