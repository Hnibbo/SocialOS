
-- Geospatial Refinements for Activities and Groups

-- 1. Ensure Groups has a PostGIS location column
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS location GEOMETRY(POINT, 4326);
CREATE INDEX IF NOT EXISTS groups_location_idx ON public.groups USING GIST (location);

-- 2. RPC for Finding Nearby Activities
CREATE OR REPLACE FUNCTION public.find_nearby_activities(
    p_lat FLOAT,
    p_long FLOAT,
    p_radius_meters FLOAT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    activity_type TEXT,
    location_name TEXT,
    lat FLOAT,
    long FLOAT,
    distance_meters FLOAT,
    expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.description,
        a.activity_type,
        a.location_name,
        ST_Y(a.location::geometry) AS lat,
        ST_X(a.location::geometry) AS long,
        ST_Distance(a.location, ST_SetSRID(ST_MakePoint(p_long, p_lat), 4326)) AS distance_meters,
        a.expires_at
    FROM public.activities a
    WHERE 
        a.status = 'active'
        AND a.expires_at > now()
        AND ST_DWithin(a.location, ST_SetSRID(ST_MakePoint(p_long, p_lat), 4326), p_radius_meters)
    ORDER BY distance_meters ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC for Finding Nearby Groups
CREATE OR REPLACE FUNCTION public.find_nearby_groups(
    p_lat FLOAT,
    p_long FLOAT,
    p_radius_meters FLOAT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    avatar_url TEXT,
    member_count INTEGER,
    lat FLOAT,
    long FLOAT,
    distance_meters FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.description,
        g.avatar_url,
        g.member_count,
        ST_Y(g.location::geometry) AS lat,
        ST_X(g.location::geometry) AS long,
        ST_Distance(g.location, ST_SetSRID(ST_MakePoint(p_long, p_lat), 4326)) AS distance_meters
    FROM public.groups g
    WHERE 
        g.is_public = true
        AND g.location IS NOT NULL
        AND ST_DWithin(g.location, ST_SetSRID(ST_MakePoint(p_long, p_lat), 4326), p_radius_meters)
    ORDER BY distance_meters ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
