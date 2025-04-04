-- Create a function to aggregate daily metrics
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(creator_id UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
  date DATE,
  total_views BIGINT,
  unique_visitors BIGINT,
  avg_time_spent NUMERIC,
  bounce_rate NUMERIC,
  top_countries JSON,
  device_breakdown JSON,
  browser_breakdown JSON
) AS $$ 
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      DATE(created_at) as view_date,
      COUNT(*) as views,
      COUNT(DISTINCT ip_address) as visitors,
      AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration,
      COUNT(CASE WHEN page_path = '/' THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) * 100 as bounce_percentage,
      jsonb_object_agg(
        country_code,
        country_count
      ) as countries,
      jsonb_object_agg(
        device_type,
        device_count
      ) as devices,
      jsonb_object_agg(
        browser,
        browser_count
      ) as browsers
    FROM (
      SELECT
        pv.*,
        COUNT(*) OVER (PARTITION BY DATE(created_at), country_code) as country_count,
        COUNT(*) OVER (PARTITION BY DATE(created_at), device_type) as device_count,
        COUNT(*) OVER (PARTITION BY DATE(created_at), browser) as browser_count
      FROM page_views pv
      WHERE 
        (pv.creator_id = aggregate_daily_metrics.creator_id OR pv.creator_id IS NULL)
        AND DATE(pv.created_at) BETWEEN start_date AND end_date
    ) subq
    GROUP BY DATE(created_at)
  )
  SELECT
    view_date,
    views,
    visitors,
    ROUND(avg_duration::numeric, 2),
    ROUND(bounce_percentage::numeric, 2),
    countries::json,
    devices::json,
    browsers::json
  FROM daily_stats
  ORDER BY view_date;
END;
$$ LANGUAGE plpgsql;

-- Create a function to aggregate engagement metrics
CREATE OR REPLACE FUNCTION aggregate_engagement_metrics(creator_id UUID, start_date DATE, end_date DATE)
RETURNS TABLE (
  date DATE,
  total_events BIGINT,
  event_types JSON,
  avg_duration NUMERIC,
  top_pages JSON
) AS $$ 
BEGIN
  RETURN QUERY
  WITH engagement_stats AS (
    SELECT
      DATE(created_at) as event_date,
      COUNT(*) as events,
      jsonb_object_agg(
        event_type,
        event_count
      ) as event_breakdown,
      AVG(duration_seconds) as avg_event_duration,
      jsonb_object_agg(
        page_path,
        page_count
      ) as pages
    FROM (
      SELECT
        ue.*,
        COUNT(*) OVER (PARTITION BY DATE(created_at), event_type) as event_count,
        COUNT(*) OVER (PARTITION BY DATE(created_at), page_path) as page_count
      FROM user_engagement ue
      WHERE 
        ue.creator_id = aggregate_engagement_metrics.creator_id
        AND DATE(ue.created_at) BETWEEN start_date AND end_date
    ) subq
    GROUP BY DATE(created_at)
  )
  SELECT
    event_date,
    events,
    event_breakdown::json,
    ROUND(avg_event_duration::numeric, 2),
    pages::json
  FROM engagement_stats
  ORDER BY event_date;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get real-time analytics
CREATE OR REPLACE FUNCTION get_realtime_analytics(creator_id UUID, minutes INTEGER DEFAULT 5)
RETURNS TABLE (
  active_users BIGINT,
  page_views BIGINT,
  current_pages JSON
) AS $$ 
BEGIN
  RETURN QUERY
  WITH realtime_stats AS (
    SELECT
      COUNT(DISTINCT ip_address) as current_users,
      COUNT(*) as views,
      jsonb_object_agg(
        page_path,
        COUNT(*)
      ) as active_pages
    FROM page_views
    WHERE 
      (creator_id = get_realtime_analytics.creator_id OR creator_id IS NULL)
      AND created_at >= NOW() - (minutes || ' minutes')::INTERVAL
    GROUP BY DATE_TRUNC('minute', created_at)
  )
  SELECT
    current_users,
    views,
    active_pages::json
  FROM realtime_stats;
END;
$$ LANGUAGE plpgsql;

-- Create a materialized view for caching daily aggregations
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_analytics_cache AS
SELECT
  creator_id,
  DATE(created_at) as date,
  COUNT(*) as total_views,
  COUNT(DISTINCT ip_address) as unique_visitors,
  jsonb_object_agg(
    country_code,
    COUNT(*)
  ) as countries,
  jsonb_object_agg(
    device_type,
    COUNT(*)
  ) as devices
FROM page_views
GROUP BY creator_id, DATE(created_at);

-- Create an index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS daily_analytics_cache_idx ON daily_analytics_cache (creator_id, date);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_analytics_cache()
RETURNS TRIGGER AS $$ 
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_analytics_cache;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to refresh the materialized view
CREATE TRIGGER refresh_analytics_cache_trigger
AFTER INSERT OR UPDATE OR DELETE ON page_views
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_analytics_cache(); 

-- Add newsletter analytics function
CREATE OR REPLACE FUNCTION get_newsletter_analytics(
  creator_id UUID,
  start_date DATE,
  end_date DATE
) RETURNS TABLE (
  date DATE,
  total_subscribers INTEGER,
  active_subscribers INTEGER,
  new_subscribers INTEGER,
  emails_sent INTEGER,
  open_rate DECIMAL,
  click_rate DECIMAL,
  unsubscribe_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      d.date,
      COUNT(DISTINCT s.id) FILTER (WHERE s.subscribed_at <= d.date) as total_subs,
      COUNT(DISTINCT s.id) FILTER (WHERE s.is_active AND s.subscribed_at <= d.date) as active_subs,
      COUNT(DISTINCT s.id) FILTER (WHERE DATE(s.subscribed_at) = d.date) as new_subs,
      COALESCE(SUM(CAST(c.stats->>'sent' AS INTEGER)), 0) as sent,
      COALESCE(SUM(CAST(c.stats->>'opened' AS INTEGER)), 0) as opened,
      COALESCE(SUM(CAST(c.stats->>'clicked' AS INTEGER)), 0) as clicked,
      COUNT(DISTINCT s.id) FILTER (WHERE NOT s.is_active AND DATE(s.updated_at) = d.date) as unsubs
    FROM generate_series(start_date, end_date, '1 day'::interval) d(date)
    LEFT JOIN newsletter_subscribers s ON s.creator_id = get_newsletter_analytics.creator_id
    LEFT JOIN newsletter_campaigns c ON c.creator_id = get_newsletter_analytics.creator_id 
      AND DATE(c.created_at) = d.date
    GROUP BY d.date
  )
  SELECT
    date,
    total_subs,
    active_subs,
    new_subs,
    sent,
    CASE WHEN sent > 0 THEN (opened::DECIMAL / sent * 100) ELSE 0 END as open_rate,
    CASE WHEN sent > 0 THEN (clicked::DECIMAL / sent * 100) ELSE 0 END as click_rate,
    CASE WHEN total_subs > 0 THEN (unsubs::DECIMAL / total_subs * 100) ELSE 0 END as unsubscribe_rate
  FROM daily_stats
  ORDER BY date;
END;
$$ LANGUAGE plpgsql;