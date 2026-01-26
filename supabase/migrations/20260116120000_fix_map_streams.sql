-- FIX: Map Streams and RPC Column Names (full_name -> display_name)

-- 1. Create RPC for fetching streaming map data (Fixes embedding 400 error)
CREATE OR REPLACE FUNCTION public.get_active_streams_on_map()
RETURNS TABLE (
    id uuid,
    title text,
    host_id uuid,
    location_lat double precision,
    location_lng double precision,
    avatar_url text,
    username text
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.host_id,
        ST_Y(up.last_known_location::geometry) as location_lat,
        ST_X(up.last_known_location::geometry) as location_lng,
        p.avatar_url,
        p.display_name as username
    FROM public.live_streams s
    JOIN public.user_presence up ON s.host_id = up.user_id
    JOIN public.user_profiles p ON s.host_id = p.id
    WHERE s.is_active = true
    AND up.last_known_location IS NOT NULL;
END;
$$;

-- 2. Repair find_nearby_users (Fixes "full_name does not exist" 400 error)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_active_streams_on_map() TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_users(double precision, double precision, integer) TO authenticated;
