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
  p_booking_date TIMESTAMP WITH TIME ZONE,
  p_duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_day_of_week INTEGER;
  v_time TIME;
  v_is_available BOOLEAN;
BEGIN
  -- Get day of week and time
  v_day_of_week := EXTRACT(DOW FROM p_booking_date);
  v_time := p_booking_date::TIME;

  -- Check if date is blocked
  IF EXISTS (
    SELECT 1 FROM creator_blocked_dates
    WHERE creator_id = p_creator_id
    AND p_booking_date BETWEEN start_date AND end_date
  ) THEN
    RETURN FALSE;
  END IF;

  -- Check regular availability
  SELECT EXISTS (
    SELECT 1 FROM creator_availability
    WHERE creator_id = p_creator_id
    AND day_of_week = v_day_of_week
    AND is_available = true
    AND v_time >= start_time
    AND (v_time + (p_duration_minutes || ' minutes')::INTERVAL) <= end_time
  ) INTO v_is_available;

  RETURN v_is_available;
END;
$$ LANGUAGE plpgsql;

-- Update booking conflict check to include availability
CREATE OR REPLACE FUNCTION check_booking_conflicts()
RETURNS TRIGGER AS $$
BEGIN
  -- Check availability first
  IF NOT check_booking_availability(NEW.creator_id, NEW.booking_date, NEW.duration_minutes) THEN
    RAISE EXCEPTION 'Time slot is not available';
  END IF;

  -- Check for conflicts with other bookings
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE creator_id = NEW.creator_id
    AND status != 'cancelled'
    AND booking_date < NEW.booking_date + (NEW.duration_minutes || ' minutes')::INTERVAL
    AND booking_date + (duration_minutes || ' minutes')::INTERVAL > NEW.booking_date
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Booking conflicts with existing booking';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
