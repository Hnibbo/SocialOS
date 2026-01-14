-- FIX RPC OUTPUT NAMES
-- Updates RPC functions to return 'location_lat' and 'location_lng' consistently to avoid 'lat' ambiguity.

-- PRE-DROP to allow Return Type Change
DROP FUNCTION IF EXISTS public.find_nearby_users(double precision, double precision, integer);
DROP FUNCTION IF EXISTS public.find_nearby_drops(double precision, double precision, integer);
DROP FUNCTION IF EXISTS public.find_nearby_assets(double precision, double precision, integer);

-- 1. find_nearby_users
CREATE OR REPLACE FUNCTION public.find_nearby_users(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer
)
RETURNS TABLE (
    id uuid,
    display_name text,
    avatar_url text,
    intent_signal text,
    energy_level integer,
    location_lat double precision,
    location_lng double precision,
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
        CASE WHEN up.last_known_location IS NOT NULL THEN ST_Y(up.last_known_location::geometry) ELSE NULL END as location_lat,
        CASE WHEN up.last_known_location IS NOT NULL THEN ST_X(up.last_known_location::geometry) ELSE NULL END as location_lng,
        up.last_seen
    FROM public.user_presence up
    INNER JOIN public.user_profiles p ON p.id = up.user_id
    WHERE up.is_visible = true
    AND up.last_known_location IS NOT NULL
    AND ST_DWithin(
        up.last_known_location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY up.last_seen DESC
    LIMIT 100;
END;
$$;

-- 2. find_nearby_drops
CREATE OR REPLACE FUNCTION public.find_nearby_drops(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer
)
RETURNS TABLE (
    id uuid, title text, description text, drop_type text,
    location_lat double precision, location_lng double precision,
    start_time timestamp with time zone, end_time timestamp with time zone,
    radius integer, location_name text
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT md.id, md.title, md.description, md.drop_type,
        CASE WHEN md.location_coords IS NOT NULL THEN (md.location_coords->>'lat')::double precision ELSE NULL END as location_lat,
        CASE WHEN md.location_coords IS NOT NULL THEN (md.location_coords->>'lng')::double precision ELSE NULL END as location_lng,
        md.start_time, md.end_time, COALESCE(md.radius_meters, 500) as radius, md.location_name
    FROM public.moment_drops md
    WHERE md.start_time <= NOW() AND md.end_time >= NOW() AND md.location_coords IS NOT NULL
    AND ST_DWithin(ST_SetSRID(ST_MakePoint(
        (md.location_coords->>'lng')::double precision, 
        (md.location_coords->>'lat')::double precision
    ), 4326)::geography,
    ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
    ORDER BY md.created_at DESC LIMIT 30;
END;
$$;

-- 3. find_nearby_assets
CREATE OR REPLACE FUNCTION public.find_nearby_assets(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer
)
RETURNS TABLE (
    id uuid, name text, description text, asset_type text,
    location_lat double precision, location_lng double precision, metadata jsonb
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT da.id, da.name, da.description, da.asset_type,
        CASE WHEN da.location IS NOT NULL THEN ST_Y(da.location::geometry) ELSE NULL END as location_lat,
        CASE WHEN da.location IS NOT NULL THEN ST_X(da.location::geometry) ELSE NULL END as location_lng,
        da.metadata
    FROM public.digital_assets da
    WHERE da.location IS NOT NULL AND (da.is_claimed = false OR da.is_claimed IS NULL)
    AND ST_DWithin(da.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
    ORDER BY da.created_at DESC LIMIT 20;
END;
$$;
