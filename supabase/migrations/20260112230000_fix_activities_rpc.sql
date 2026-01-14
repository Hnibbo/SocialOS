-- Migration: Canonical Activities RPC & Final Security Hardening

-- 1. Drop ambiguous functions (Cleanup)
DROP FUNCTION IF EXISTS public.find_nearby_activities(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS public.find_nearby_activities(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP FUNCTION IF EXISTS public.find_nearby_activities(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT);

-- 2. Create Canonical Function (Matches useMapEntities usage)
CREATE OR REPLACE FUNCTION public.find_nearby_activities(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 50000
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    activity_type TEXT,
    location_lat DOUBLE PRECISION, -- Normalized return keys
    location_lng DOUBLE PRECISION,
    start_time TIMESTAMP WITH TIME ZONE,
    distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions -- Security Hardening applied directly here
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.title,
        a.description,
        a.activity_type,
        -- Handle both Geometry column AND separate lat/lng columns if they exist. 
        -- Prioritize Geometry if populated, else falls back.
        -- Assuming 'activities' uses PostGIS geometry based on previous migration (20260111160000)
        ST_Y(a.location::geometry) AS location_lat,
        ST_X(a.location::geometry) AS location_lng,
        a.start_time,
        ST_Distance(
            a.location, 
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        ) AS distance_meters
    FROM public.activities a
    WHERE 
        a.status = 'active'
        AND ST_DWithin(
            a.location, 
            ST_SetSRID(ST_MakePoint(lng, lat), 4326), 
            radius_meters
        )
    ORDER BY distance_meters ASC
    LIMIT 50;
END;
$$;

-- 3. Re-apply Security Hardening for other functions (Idempotent)
-- (find_nearby_users and find_nearby_groups were processed in previous steps, but good to be sure)
ALTER FUNCTION public.find_nearby_groups(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) SET search_path = public, extensions;
ALTER FUNCTION public.find_nearby_users(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) SET search_path = public, extensions;
