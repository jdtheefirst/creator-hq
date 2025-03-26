-- Create newsletter_subscribers table
create table newsletter_subscribers (
  id uuid default uuid_generate_v4() primary key,
  email text not null unique,
  subscribed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_active boolean default true
);

-- Enable RLS
alter table newsletter_subscribers enable row level security;

-- Create policies
create policy "Anyone can subscribe to newsletter"
  on newsletter_subscribers for insert
  with check (true);

create policy "Only admins can view subscribers"
  on newsletter_subscribers for select
  using (auth.jwt() ->> 'email' in (select email from admin_emails));

create policy "Only admins can update subscriber status"
  on newsletter_subscribers for update
  using (auth.jwt() ->> 'email' in (select email from admin_emails));

create policy "Only admins can delete subscribers"
  on newsletter_subscribers for delete
  using (auth.jwt() ->> 'email' in (select email from admin_emails)); 