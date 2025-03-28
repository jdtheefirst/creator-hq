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

-- Create indexes for faster queries
create index page_views_creator_id_idx on page_views(creator_id);
create index page_views_view_date_idx on page_views(view_date);
create index user_engagement_creator_id_idx on user_engagement(creator_id);
create index user_engagement_event_date_idx on user_engagement(event_date);
create index revenue_metrics_creator_id_idx on revenue_metrics(creator_id);
create index revenue_metrics_date_idx on revenue_metrics(date);

-- Create function to update updated_at timestamp
create trigger update_revenue_metrics_updated_at
  before update on revenue_metrics
  for each row
  execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table page_views enable row level security;
alter table user_engagement enable row level security;
alter table revenue_metrics enable row level security;

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