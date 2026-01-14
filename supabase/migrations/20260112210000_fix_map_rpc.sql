-- RPC: Find Nearby Users (Direct Lat/Lng version for Map Dragging)
DROP FUNCTION IF EXISTS public.find_nearby_users(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);

CREATE OR REPLACE FUNCTION public.find_nearby_users(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 50000
)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    avatar_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    last_seen TIMESTAMP WITH TIME ZONE,
    distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id AS id,
        p.full_name AS display_name,
        p.avatar_url,
        ST_Y(up.last_known_location::geometry) AS latitude,
        ST_X(up.last_known_location::geometry) AS longitude,
        up.last_seen,
        ST_Distance(
            up.last_known_location, 
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
        ) AS distance_meters
    FROM public.user_presence up
    JOIN public.user_profiles p ON p.id = up.user_id
    WHERE 
        up.is_visible = true
        AND ST_DWithin(
            up.last_known_location, 
            ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, 
            radius_meters
        )
    ORDER BY distance_meters ASC
    LIMIT 50;
END;
$$;
