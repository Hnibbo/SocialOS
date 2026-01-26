-- RPC for Finding Nearby Users (Clean Lat/Lng Return)
CREATE OR REPLACE FUNCTION public.find_nearby_users(
    p_user_id UUID,
    p_radius_meters FLOAT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    display_name TEXT,
    avatar_url TEXT,
    lat FLOAT,
    long FLOAT,
    last_seen TIMESTAMP WITH TIME ZONE,
    distance_meters FLOAT
) AS $$
DECLARE
    v_user_geom GEOMETRY(POINT, 4326);
BEGIN
    -- Get requester's location
    SELECT last_known_location INTO v_user_geom
    FROM public.user_presence
    WHERE user_id = p_user_id;

    -- Return empty if user has no location
    IF v_user_geom IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        up.user_id AS id,
        p.full_name AS display_name,
        p.avatar_url,
        ST_Y(up.last_known_location::geometry) AS lat,
        ST_X(up.last_known_location::geometry) AS long,
        up.last_seen,
        ST_Distance(up.last_known_location, v_user_geom) AS distance_meters
    FROM public.user_presence up
    JOIN public.profiles p ON p.id = up.user_id
    WHERE 
        up.user_id != p_user_id -- Exclude self
        AND up.is_visible = true
        AND ST_DWithin(up.last_known_location, v_user_geom, p_radius_meters)
    ORDER BY distance_meters ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
