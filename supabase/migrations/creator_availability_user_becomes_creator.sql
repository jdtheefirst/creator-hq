create or replace function create_default_availability()
returns trigger as $$
begin
  -- Only run if new role is 'creator'
  if NEW.role = 'creator' and (TG_OP = 'INSERT' or OLD.role is distinct from NEW.role) then
    -- Insert default 09:00–16:00 availability for all days
    insert into creator_availability (creator_id, day_of_week, start_time, end_time)
    select NEW.id, dow, '09:00', '16:00'
    from generate_series(0, 6) as dow;
  end if;

  return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_create_default_availability on public.users;

create trigger trg_create_default_availability
after insert or update on public.users
for each row
execute function create_default_availability();

insert into creator_availability (creator_id, day_of_week, start_time, end_time)
select 'replace with some Creator-ID', dow, '09:00', '16:00'
from generate_series(0, 6) as dow
on conflict (creator_id, day_of_week) do nothing;
