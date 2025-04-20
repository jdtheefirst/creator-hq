-- Create page_views table
create table page_views (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references auth.users(id) on delete cascade not null,
  page_path text not null,
  view_date timestamp with time zone default timezone('utc'::text, now()) not null,
  user_agent text,
  referrer text,
  ip_address text,
  country text,
  device_type text,
  session_id text
);

-- Create user_engagement table
create table user_engagement (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references auth.users(id) on delete cascade not null,
  event_type text not null check (event_type in ('view', 'click', 'scroll', 'time_spent', 'conversion')),
  event_date timestamp with time zone default timezone('utc'::text, now()) not null,
  page_path text not null,
  element_id text,
  duration_seconds integer,
  metadata jsonb
);

-- Create revenue_metrics table
create table revenue_metrics (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  total_revenue decimal(10,2) not null default 0,
  bookings_revenue decimal(10,2) not null default 0,
  products_revenue decimal(10,2) not null default 0,
  total_bookings integer not null default 0,
  total_products_sold integer not null default 0,
  average_order_value decimal(10,2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(creator_id, date)
);

-- Create newsletter metrics table
CREATE TABLE newsletter_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_subscribers INTEGER DEFAULT 0,
  active_subscribers INTEGER DEFAULT 0,
  new_subscribers INTEGER DEFAULT 0,
  unsubscribed INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  email_opens INTEGER DEFAULT 0,
  email_clicks INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(creator_id, date)
);

-- Add video metrics table
CREATE TABLE video_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_views INTEGER DEFAULT 0,
  total_likes INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  watch_time_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(creator_id, date)
);

-- Create indexes for faster queries
create index page_views_creator_id_idx on page_views(creator_id);
create index page_views_view_date_idx on page_views(view_date);
create index user_engagement_creator_id_idx on user_engagement(creator_id);
create index user_engagement_event_date_idx on user_engagement(event_date);
create index revenue_metrics_creator_id_idx on revenue_metrics(creator_id);
create index revenue_metrics_date_idx on revenue_metrics(date);
create index newsletter_metrics_creator_id_idx on newsletter_metrics(creator_id);
create index newsletter_metrics_date_idx on newsletter_metrics(date);
create index video_metrics_creator_id_idx on video_metrics(creator_id);
create index video_metrics_date_idx on video_metrics(date);

-- Create function to update updated_at timestamp
create trigger update_revenue_metrics_updated_at
  before update on revenue_metrics
  for each row
  execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table page_views enable row level security;
alter table user_engagement enable row level security;
alter table revenue_metrics enable row level security;
alter table newsletter_metrics enable row level security;
ALTER TABLE video_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for page_views
create policy "Creators can view their own page views"
  on page_views for select
  using (auth.uid() = creator_id);

create policy "Creators can insert their own page views"
  on page_views for insert
  with check (auth.uid() = creator_id);

-- Create policies for user_engagement
create policy "Creators can view their own user engagement"
  on user_engagement for select
  using (auth.uid() = creator_id);

create policy "Creators can insert their own user engagement"
  on user_engagement for insert
  with check (auth.uid() = creator_id);

-- Create policies for revenue_metrics
create policy "Creators can view their own revenue metrics"
  on revenue_metrics for select
  using (auth.uid() = creator_id);

create policy "Creators can insert their own revenue metrics"
  on revenue_metrics for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their own revenue metrics"
  on revenue_metrics for update
  using (auth.uid() = creator_id);

-- Create policies for newsletter_metrics
create policy "Creators can view their own newsletter metrics"
  on newsletter_metrics for select
  using (auth.uid() = creator_id);

-- Create policies for video_metrics
CREATE POLICY "Creators can view their own video metrics"
  ON video_metrics FOR SELECT
  USING (auth.uid() = creator_id);

-- Create function to update video metrics
CREATE OR REPLACE FUNCTION update_video_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO video_metrics (
    creator_id,
    date,
    total_views,
    total_likes,
    total_comments
  )
  SELECT
    creator_id,
    CURRENT_DATE,
    SUM(views),
    SUM(likes),
    COUNT(DISTINCT c.id)
  FROM videos v
  LEFT JOIN comments c ON c.post_id = v.id AND c.post_type = 'video'
  WHERE v.creator_id = NEW.creator_id
  GROUP BY creator_id
  ON CONFLICT (creator_id, date) 
  DO UPDATE SET
    total_views = EXCLUDED.total_views,
    total_likes = EXCLUDED.total_likes,
    total_comments = EXCLUDED.total_comments,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for video metrics
CREATE TRIGGER update_video_metrics_trigger
  AFTER INSERT OR UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_video_metrics();

-- Create function to aggregate daily revenue metrics
create or replace function aggregate_daily_revenue_metrics()
returns trigger as $$ 
begin
  insert into revenue_metrics (
    creator_id,
    date,
    total_revenue,
    bookings_revenue,
    products_revenue,
    total_bookings,
    total_products_sold,
    average_order_value
  )
  select
    creator_id,
    date_trunc('day', created_at)::date,
    sum(price),
    sum(case when service_type is not null then price else 0 end),
    sum(case when service_type is null then price else 0 end),
    count(case when service_type is not null then 1 end),
    count(case when service_type is null then 1 end),
    avg(price)
  from bookings
  where creator_id = new.creator_id
  and date_trunc('day', created_at)::date = date_trunc('day', new.created_at)::date
  group by creator_id, date_trunc('day', created_at)::date
  on conflict (creator_id, date) do update
  set
    total_revenue = excluded.total_revenue,
    bookings_revenue = excluded.bookings_revenue,
    products_revenue = excluded.products_revenue,
    total_bookings = excluded.total_bookings,
    total_products_sold = excluded.total_products_sold,
    average_order_value = excluded.average_order_value,
    updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to update revenue metrics
create trigger update_revenue_metrics_trigger
  after insert or update on bookings
  for each row
  execute function aggregate_daily_revenue_metrics();

-- Create function to aggregate order revenue metrics
-- This function aggregates revenue metrics for each order and updates the revenue_metrics table
create or replace function aggregate_order_revenue_metrics()
returns trigger as $$
begin
  insert into revenue_metrics (
    creator_id,
    date,
    total_revenue,
    products_revenue,
    total_products_sold,
    average_order_value
  )
  select
    new.creator_id,
    date_trunc('day', new.created_at)::date,
    sum(oi.unit_price * oi.quantity),
    sum(oi.unit_price * oi.quantity),
    sum(oi.quantity),
    avg(oi.unit_price * oi.quantity)
  from order_items oi
  where oi.order_id = new.id
  group by new.creator_id, date_trunc('day', new.created_at)::date
  on conflict (creator_id, date) do update
  set
    total_revenue = revenue_metrics.total_revenue + excluded.total_revenue,
    products_revenue = revenue_metrics.products_revenue + excluded.products_revenue,
    total_products_sold = revenue_metrics.total_products_sold + excluded.total_products_sold,
    average_order_value = 
      (revenue_metrics.total_revenue + excluded.total_revenue) / 
      (revenue_metrics.total_products_sold + excluded.total_products_sold),
    updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to update order revenue metrics
-- This trigger is fired after an order is inserted and calls the aggregate_order_revenue_metrics function
create trigger update_order_revenue_metrics_trigger
  after insert on orders
  for each row
  when (new.status = 'paid')
  execute function aggregate_order_revenue_metrics();


-- Create function to update newsletter metrics
CREATE OR REPLACE FUNCTION update_newsletter_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO newsletter_metrics (
    creator_id,
    date,
    total_subscribers,
    active_subscribers,
    new_subscribers,
    emails_sent,
    email_opens,
    email_clicks
  )
  SELECT
    NEW.creator_id,
    CURRENT_DATE,
    (SELECT COUNT(*) FROM newsletter_subscribers WHERE creator_id = NEW.creator_id),
    (SELECT COUNT(*) FROM newsletter_subscribers WHERE creator_id = NEW.creator_id AND is_active = true),
    (SELECT COUNT(*) FROM newsletter_subscribers WHERE creator_id = NEW.creator_id AND DATE(subscribed_at) = CURRENT_DATE),
    COALESCE((SELECT SUM(CAST(stats->>'sent' AS INTEGER)) FROM newsletter_campaigns 
      WHERE creator_id = NEW.creator_id AND DATE(created_at) = CURRENT_DATE), 0),
    COALESCE((SELECT SUM(CAST(stats->>'opened' AS INTEGER)) FROM newsletter_campaigns 
      WHERE creator_id = NEW.creator_id AND DATE(created_at) = CURRENT_DATE), 0),
    COALESCE((SELECT SUM(CAST(stats->>'clicked' AS INTEGER)) FROM newsletter_campaigns 
      WHERE creator_id = NEW.creator_id AND DATE(created_at) = CURRENT_DATE), 0)
  ON CONFLICT (creator_id, date) 
  DO UPDATE SET
    total_subscribers = EXCLUDED.total_subscribers,
    active_subscribers = EXCLUDED.active_subscribers,
    new_subscribers = EXCLUDED.new_subscribers,
    emails_sent = EXCLUDED.emails_sent,
    email_opens = EXCLUDED.email_opens,
    email_clicks = EXCLUDED.email_clicks,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for newsletter metrics
CREATE TRIGGER update_newsletter_metrics_on_subscriber
  AFTER INSERT OR UPDATE OR DELETE ON newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION update_newsletter_metrics();

CREATE TRIGGER update_newsletter_metrics_on_campaign
  AFTER INSERT OR UPDATE ON newsletter_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_newsletter_metrics();