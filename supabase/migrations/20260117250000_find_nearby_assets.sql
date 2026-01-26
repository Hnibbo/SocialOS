-- Implement find_nearby_assets function
-- Returns nearby digital assets from the marketplace

DROP FUNCTION IF EXISTS find_nearby_assets(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);

CREATE FUNCTION find_nearby_assets(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    image_url TEXT,
    price_cents BIGINT,
    creator_id UUID,
    creator_display_name TEXT,
    creator_avatar_url TEXT,
    location_name TEXT,
    distance_meters DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        da.id,
        da.name,
        da.slug,
        da.description,
        da.image_url,
        da.price_cents,
        da.creator_id,
        up.display_name AS creator_display_name,
        up.avatar_url AS creator_avatar_url,
        da.location_name,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(lng, lat), 4326),
            da.location
        ) * 111320 AS distance_meters
    FROM digital_assets da
    JOIN user_profiles up ON da.creator_id = up.id
    WHERE da.is_active = true
        AND da.location IS NOT NULL
        AND ST_DWithin(
            da.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326),
            radius_meters::double precision / 111320
        )
        AND up.banned = false
        AND up.profile_visible = true
    ORDER BY distance_meters
    LIMIT 50;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_nearby_assets TO authenticated;
GRANT EXECUTE ON FUNCTION find_nearby_assets TO anon;

COMMENT ON FUNCTION find_nearby_assets IS 'Finds nearby digital assets within specified radius in meters';
