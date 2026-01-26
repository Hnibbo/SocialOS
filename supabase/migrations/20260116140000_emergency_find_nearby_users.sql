-- EMERGENCY FIX: Recreate find_nearby_users
-- This function was missing from the database

DROP FUNCTION IF EXISTS public.find_nearby_users(double precision, double precision, integer);

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
        COALESCE(p.display_name, 'Anonymous') as display_name,
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

GRANT EXECUTE ON FUNCTION public.find_nearby_users(double precision, double precision, integer) TO authenticated;
