CREATE TABLE IF NOT EXISTS booking_metrics (
  creator_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  pending_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  avg_duration_minutes INTEGER DEFAULT 0,
  revenue_generated NUMERIC(10,2) DEFAULT 0
);

ALTER TABLE booking_metrics ENABLE ROW LEVEL SECURITY;

-- Service role can perform all operations
CREATE POLICY "Service role has everything"
  ON booking_metrics FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Creators can manage their own bookings_metrics"
  ON booking_metrics FOR ALL
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);


CREATE OR REPLACE FUNCTION update_booking_metrics()
RETURNS TRIGGER AS $$
DECLARE
  _total INTEGER;
  _completed INTEGER;
  _pending INTEGER;
  _cancelled INTEGER;
  _avg_duration_minutes INTEGER;
  _revenue_generated NUMERIC(10,2);
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status IS NOT NULL) AS total,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
    COALESCE(AVG(duration_minutes), 0) AS avg_duration_minutes,
    COALESCE(SUM(price) FILTER (WHERE payment_status = 'paid'), 0) AS revenue
  INTO _total, _completed, _pending, _cancelled, _avg_duration_minutes, _revenue_generated
  FROM bookings
  WHERE creator_id = NEW.creator_id;

  INSERT INTO booking_metrics (
    creator_id,
    total_bookings,
    completed_bookings,
    pending_bookings,
    cancelled_bookings,
    avg_duration_minutes,
    revenue_generated
  )
  VALUES (
    NEW.creator_id,
    _total,
    _completed,
    _pending,
    _cancelled,
    _avg_duration_minutes,
    _revenue_generated
  )
  ON CONFLICT (creator_id)
  DO UPDATE SET
    total_bookings = EXCLUDED.total_bookings,
    completed_bookings = EXCLUDED.completed_bookings,
    pending_bookings = EXCLUDED.pending_bookings,
    cancelled_bookings = EXCLUDED.cancelled_bookings,
    avg_duration_minutes = EXCLUDED.avg_duration_minutes,
    revenue_generated = EXCLUDED.revenue_generated;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_booking_metrics ON bookings;

CREATE TRIGGER trigger_update_booking_metrics
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_booking_metrics();
