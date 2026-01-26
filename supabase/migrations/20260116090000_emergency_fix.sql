-- EMERGENCY FIX: RPC Functions & Realtime (REVISED V3)
-- Final standardization of parameter names to: lat, lng, radius_meters

BEGIN;
  DO $$
  BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
          CREATE PUBLICATION supabase_realtime;
      END IF;
  END
  $$;
  ALTER PUBLICATION supabase_realtime SET TABLE 
    user_presence, 
    live_streams, 
    group_messages, 
    dating_swipes,
    notifications,
    user_profiles;
COMMIT;

-- Drop existing functions to ensure clean slate
DROP FUNCTION IF EXISTS public.find_nearby_users(double precision, double precision, integer) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_activities(double precision, double precision, integer) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_groups(double precision, double precision, integer) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_drops(double precision, double precision, integer) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_assets(double precision, double precision, integer) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_location(float, float) CASCADE;

-- Drop generic float variants/old param names
DROP FUNCTION IF EXISTS public.find_nearby_users(float, float, integer) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_activities(float, float, integer) CASCADE;

-- 1. find_nearby_users
CREATE OR REPLACE FUNCTION public.find_nearby_users(
    lat double precision,
    lng double precision,
    radius_meters integer
)
RETURNS TABLE (
    id uuid,
    display_name text,
    avatar_url text,
    intent_signal text,
    energy_level integer,
    lat double precision,
    lng double precision,
    last_seen timestamp with time zone
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id as id,
        COALESCE(p.full_name, 'Anonymous') as display_name,
        p.avatar_url,
        up.intent_signal,
        up.energy_level,
        CASE WHEN up.last_known_location IS NOT NULL THEN ST_Y(up.last_known_location::geometry) ELSE NULL END as lat,
        CASE WHEN up.last_known_location IS NOT NULL THEN ST_X(up.last_known_location::geometry) ELSE NULL END as lng,
        up.last_seen
    FROM public.user_presence up
    INNER JOIN public.user_profiles p ON p.id = up.user_id
    WHERE up.is_visible = true
    AND up.last_known_location IS NOT NULL
    AND ST_DWithin(
        up.last_known_location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
    )
    ORDER BY up.last_seen DESC
    LIMIT 100;
END;
$$;

-- 2. find_nearby_activities
CREATE OR REPLACE FUNCTION public.find_nearby_activities(
    lat double precision,
    lng double precision,
    radius_meters integer
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    activity_type text,
    location_lat double precision,
    location_lng double precision,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    location_name text
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id, a.title, a.description, a.activity_type,
        CASE WHEN a.location IS NOT NULL THEN ST_Y(a.location::geometry) ELSE NULL END as location_lat,
        CASE WHEN a.location IS NOT NULL THEN ST_X(a.location::geometry) ELSE NULL END as location_lng,
        a.start_time, a.end_time, a.location_name
    FROM public.activities a
    WHERE a.status = 'active' AND a.start_time >= NOW() AND a.location IS NOT NULL
    AND ST_DWithin(a.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
    ORDER BY a.start_time ASC LIMIT 50;
END;
$$;

-- 3. find_nearby_groups
CREATE OR REPLACE FUNCTION public.find_nearby_groups(
    lat double precision,
    lng double precision,
    radius_meters integer
)
RETURNS TABLE (
    id uuid, name text, description text, member_count integer,
    location_lat double precision, location_lng double precision, cover_url text
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT g.id, g.name, g.description, g.member_count,
        CASE WHEN g.location IS NOT NULL THEN ST_Y(g.location::geometry) ELSE NULL END as location_lat,
        CASE WHEN g.location IS NOT NULL THEN ST_X(g.location::geometry) ELSE NULL END as location_lng,
        g.cover_url
    FROM public.groups g
    WHERE g.location IS NOT NULL AND g.is_public = true
    AND ST_DWithin(g.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
    ORDER BY g.member_count DESC LIMIT 50;
END;
$$;

-- 4. find_nearby_drops
CREATE OR REPLACE FUNCTION public.find_nearby_drops(
    lat double precision,
    lng double precision,
    radius_meters integer
)
RETURNS TABLE (
    id uuid, title text, description text, drop_type text,
    lat double precision, lng double precision,
    start_time timestamp with time zone, end_time timestamp with time zone,
    radius integer, location_name text
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT md.id, md.title, md.description, md.drop_type,
        CASE WHEN md.location_coords IS NOT NULL THEN (md.location_coords->>'lat')::double precision ELSE NULL END as lat,
        CASE WHEN md.location_coords IS NOT NULL THEN (md.location_coords->>'lng')::double precision ELSE NULL END as lng,
        md.start_time, md.end_time, COALESCE(md.radius_meters, 500) as radius, md.location_name
    FROM public.moment_drops md
    WHERE md.start_time <= NOW() AND md.end_time >= NOW() AND md.location_coords IS NOT NULL
    AND ST_DWithin(ST_SetSRID(ST_MakePoint(
        (md.location_coords->>'lng')::double precision, 
        (md.location_coords->>'lat')::double precision
    ), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
    ORDER BY md.created_at DESC LIMIT 30;
END;
$$;

-- 5. find_nearby_assets
CREATE OR REPLACE FUNCTION public.find_nearby_assets(
    lat double precision,
    lng double precision,
    radius_meters integer
)
RETURNS TABLE (
    id uuid, name text, description text, asset_type text,
    lat double precision, lng double precision, metadata jsonb
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT da.id, da.name, da.description, da.asset_type,
        CASE WHEN da.location IS NOT NULL THEN ST_Y(da.location::geometry) ELSE NULL END as lat,
        CASE WHEN da.location IS NOT NULL THEN ST_X(da.location::geometry) ELSE NULL END as lng,
        da.metadata
    FROM public.digital_assets da
    WHERE da.location IS NOT NULL AND (da.is_claimed = false OR da.is_claimed IS NULL)
    AND ST_DWithin(da.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, radius_meters)
    ORDER BY da.created_at DESC LIMIT 20;
END;
$$;

-- 6. update_user_location
CREATE OR REPLACE FUNCTION public.update_user_location(lat float, lng float)
RETURNS void AS $$
BEGIN
    INSERT INTO public.user_presence (user_id, last_known_location, last_location_updated_at, online_at, updated_at, last_seen, is_visible)
    VALUES (auth.uid(), ST_SetSRID(ST_MakePoint(lng, lat), 4326), NOW(), NOW(), NOW(), NOW(),
        COALESCE((SELECT is_visible FROM public.user_presence WHERE user_id = auth.uid()), true))
    ON CONFLICT (user_id) DO UPDATE SET 
        last_known_location = ST_SetSRID(ST_MakePoint(lng, lat), 4326),
        last_location_updated_at = NOW(), online_at = NOW(), updated_at = NOW(), last_seen = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for specific signatures
GRANT EXECUTE ON FUNCTION public.find_nearby_users(double precision, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_activities(double precision, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_groups(double precision, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_drops(double precision, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_assets(double precision, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_location(float, float) TO authenticated;
