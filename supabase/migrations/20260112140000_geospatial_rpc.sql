-- Enable PostGIS if not already
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Optimized Activity Search
CREATE OR REPLACE FUNCTION find_nearby_activities(
  lat float,
  lng float,
  radius_meters float DEFAULT 5000,
  filter_type text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  activity_type text,
  location_lat float,
  location_lng float,
  start_time timestamptz,
  dist_meters float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.description,
    a.activity_type,
    a.location_lat,
    a.location_lng,
    a.start_time,
    st_distance(
      st_setsrid(st_makepoint(a.location_lng, a.location_lat), 4326)::geography,
      st_setsrid(st_makepoint(lng, lat), 4326)::geography
    ) as dist_meters
  FROM activities a
  WHERE
    st_dwithin(
      st_setsrid(st_makepoint(a.location_lng, a.location_lat), 4326)::geography,
      st_setsrid(st_makepoint(lng, lat), 4326)::geography,
      radius_meters
    )
    AND (filter_type IS NULL OR a.activity_type = filter_type)
    AND a.start_time > now() -- Only future activities
  ORDER BY dist_meters ASC;
END;
$$;

-- 2. Optimized Group Search
CREATE OR REPLACE FUNCTION find_nearby_groups(
  lat float,
  lng float,
  radius_meters float DEFAULT 10000
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  member_count int,
  location_lat float,
  location_lng float,
  dist_meters float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.description,
    g.member_count,
    g.location_lat,
    g.location_lng,
    st_distance(
      st_setsrid(st_makepoint(g.location_lng, g.location_lat), 4326)::geography,
      st_setsrid(st_makepoint(lng, lat), 4326)::geography
    ) as dist_meters
  FROM groups g
  WHERE
    g.location_lat IS NOT NULL 
    AND g.location_lng IS NOT NULL
    AND st_dwithin(
      st_setsrid(st_makepoint(g.location_lng, g.location_lat), 4326)::geography,
      st_setsrid(st_makepoint(lng, lat), 4326)::geography,
      radius_meters
    )
  ORDER BY dist_meters ASC;
END;
$$;
