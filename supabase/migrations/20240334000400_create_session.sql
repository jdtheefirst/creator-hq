create table checkout_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  creator_id uuid references auth.users(id),
  type text not null, -- 'order', 'booking', 'vip', etc.
  stripe_session_id text unique,
  status text check (status in ('pending', 'completed', 'failed', 'expired')) default 'pending',
  total_amount decimal(10,2),
  currency text default 'USD',
  items jsonb, -- store the cart items for later insight
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Policies
create policy "User can view their own checkout sessions"
  on checkout_sessions for select
  using (auth.uid() = user_id or auth.uid() = creator_id);

create policy "User can insert their own checkout session"
  on checkout_sessions for insert
  with check (auth.uid() = user_id);

create policy "Allow updates only for system or owner"
  on checkout_sessions for update
  using (auth.uid() = user_id or auth.uid() = creator_id);
