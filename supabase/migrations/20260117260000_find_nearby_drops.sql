-- Implement find_nearby_drops function
-- Returns nearby moment drops (viral time-limited events)

DROP FUNCTION IF EXISTS find_nearby_drops(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);

CREATE FUNCTION find_nearby_drops(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
    id UUID,
    creator_id UUID,
    creator_display_name TEXT,
    creator_avatar_url TEXT,
    drop_type TEXT,
    title TEXT,
    description TEXT,
    location_name TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    current_participants INTEGER,
    reward_xp INTEGER,
    reward_items JSONB,
    is_anonymous BOOLEAN,
    is_viral BOOLEAN,
    distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        md.id,
        md.creator_id,
        up.display_name AS creator_display_name,
        up.avatar_url AS creator_avatar_url,
        md.drop_type,
        md.title,
        md.description,
        md.location_name,
        md.start_time,
        md.end_time,
        md.max_participants,
        md.current_participants,
        md.reward_xp,
        md.reward_items,
        md.is_anonymous,
        md.is_viral,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(lng, lat), 4326),
            md.location_coords
        ) * 111320 AS distance_meters
    FROM moment_drops md
    JOIN user_profiles up ON md.creator_id = up.id
    WHERE md.is_active = true
        AND md.end_time > NOW()
        AND md.start_time <= NOW()
        AND md.location_coords IS NOT NULL
        AND ST_DWithin(
            md.location_coords,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326),
            radius_meters::double precision / 111320
        )
        AND up.banned = false
        AND up.profile_visible = true
    ORDER BY
        md.start_time ASC,
        distance_meters
    LIMIT 50;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_nearby_drops TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_drops TO anon;

COMMENT ON FUNCTION find_nearby_drops IS 'Finds nearby active moment drops (viral events) within specified radius in meters';
