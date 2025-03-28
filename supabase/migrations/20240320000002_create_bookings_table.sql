-- Create bookings table
create table bookings (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references auth.users(id) on delete cascade not null,
  client_name text not null,
  client_email text not null,
  service_type text not null check (service_type in ('consultation', 'workshop', 'mentoring', 'other')),
  booking_date timestamp with time zone not null,
  duration_minutes integer not null check (duration_minutes > 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  price decimal(10,2) not null check (price >= 0),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'refunded')),
  payment_id text,
  meeting_link text,
  cancellation_reason text
);

-- Create indexes for faster queries
create index bookings_creator_id_idx on bookings(creator_id);
create index bookings_status_idx on bookings(status);
create index bookings_booking_date_idx on bookings(booking_date);

-- Create function to update updated_at timestamp
create trigger update_bookings_updated_at
  before update on bookings
  for each row
  execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table bookings enable row level security;

-- Create policies
create policy "Creators can view their own bookings"
  on bookings for select
  using (auth.uid() = creator_id);

create policy "Creators can insert their own bookings"
  on bookings for insert
  with check (auth.uid() = creator_id);

create policy "Creators can update their own bookings"
  on bookings for update
  using (auth.uid() = creator_id);

create policy "Creators can delete their own bookings"
  on bookings for delete
  using (auth.uid() = creator_id);

-- Create function to check for booking conflicts
create or replace function check_booking_conflicts()
returns trigger as $$
begin
  if exists (
    select 1 from bookings
    where creator_id = new.creator_id
    and status != 'cancelled'
    and booking_date < new.booking_date + (new.duration_minutes || ' minutes')::interval
    and booking_date + (duration_minutes || ' minutes')::interval > new.booking_date
    and id != new.id
  ) then
    raise exception 'Booking conflicts with existing booking';
  end if;
  return new;
end;
$$ language plpgsql;

-- Create trigger to check for booking conflicts
create trigger check_booking_conflicts_trigger
  before insert or update on bookings
  for each row
  execute function check_booking_conflicts(); 