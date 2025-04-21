-- Create availability settings table
CREATE TABLE creator_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(creator_id, day_of_week)
);

-- Create blocked dates table for holidays, vacations, etc.
CREATE TABLE creator_blocked_dates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE creator_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Creators can manage their own availability"
  ON creator_availability FOR ALL
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can manage their blocked dates"
  ON creator_blocked_dates FOR ALL
  USING (auth.uid() = creator_id);

-- Create function to check availability
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_creator_id UUID,
  p_booking_date TIMESTAMPTZ, -- Must include full timestamp w/ time
  p_duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_start_time TIME;
  v_end_time TIME;
  v_is_available BOOLEAN;
BEGIN
  -- Extract time and weekday from the timestamp
  v_start_time := p_booking_date::time;
  v_end_time := (p_booking_date + (p_duration_minutes || ' minutes')::interval)::time;
  v_day_of_week := EXTRACT(DOW FROM p_booking_date);

  -- Check if date is blocked (holidays, vacations)
  IF EXISTS (
    SELECT 1
    FROM creator_blocked_dates
    WHERE creator_id = p_creator_id
      AND p_booking_date >= start_date
      AND p_booking_date < end_date
  ) THEN
    RETURN FALSE;
  END IF;

  -- Check regular availability
  SELECT EXISTS (
    SELECT 1
    FROM creator_availability
    WHERE creator_id = p_creator_id
      AND day_of_week = v_day_of_week
      AND is_available = true
      AND start_time <= v_start_time
      AND end_time >= v_end_time
  ) INTO v_is_available;

  RETURN v_is_available;
END;
$$ LANGUAGE plpgsql;

-- Update booking conflict check to include availability
CREATE OR REPLACE FUNCTION check_booking_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  v_end_time TIMESTAMPTZ;
BEGIN
  -- Calculate end time
  v_end_time := NEW.booking_date + (NEW.duration_minutes || ' minutes')::INTERVAL;

  -- 🔍 Check availability first (day/time/block validation)
  IF NOT check_booking_availability(NEW.creator_id, NEW.booking_date, NEW.duration_minutes) THEN
    RAISE EXCEPTION 'Time slot is not available';
  END IF;

  -- 🔥 Check for conflicts with other bookings (double-booking)
  IF EXISTS (
    SELECT 1
    FROM bookings
    WHERE creator_id = NEW.creator_id
      AND status != 'cancelled'
      AND booking_date < v_end_time
      AND (booking_date + (duration_minutes || ' minutes')::INTERVAL) > NEW.booking_date
      AND id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'Booking conflicts with existing booking';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
