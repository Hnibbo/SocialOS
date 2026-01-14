-- Hup v2.0 RPC Functions
-- These functions are used by the frontend to query nearby entities

-- Find nearby users for the live map
CREATE OR REPLACE FUNCTION find_nearby_users(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer DEFAULT 50000
)
RETURNS TABLE (
    id uuid,
    display_name text,
    avatar_url text,
    intent_signal text,
    energy_level integer,
    lat double precision,
    lng double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.id,
        COALESCE(up.display_name, 'Anonymous') as display_name,
        up.avatar_url,
        up.intent_signal,
        up.energy_level,
        (up.location->>'coordinates'::text)->>1::double precision as lat,
        (up.location->>'coordinates'::text)->>0::double precision as lng
    FROM user_profiles up
    INNER JOIN user_presence up2 ON up.id = up2.user_id
    WHERE up2.is_visible = true
    AND up2.location IS NOT NULL
    AND ST_DWithin(
        up2.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY up2.last_seen DESC
    LIMIT 100;
END;
$$;

-- Find nearby activities
CREATE OR REPLACE FUNCTION find_nearby_activities(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer DEFAULT 50000
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    activity_type text,
    location_lat double precision,
    location_lng double precision,
    location_name text,
    start_time timestamp with time zone,
    end_time timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.title,
        a.description,
        a.activity_type,
        (a.location->>'coordinates'::text)->>1::double precision as location_lat,
        (a.location->>'coordinates'::text)->>0::double precision as location_lng,
        a.location_name,
        a.start_time,
        a.end_time
    FROM activities a
    WHERE a.status = 'active'
    AND a.start_time >= NOW()
    AND a.location IS NOT NULL
    AND ST_DWithin(
        a.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY a.start_time ASC
    LIMIT 50;
END;
$$;

-- Find nearby groups
CREATE OR REPLACE FUNCTION find_nearby_groups(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer DEFAULT 50000
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    member_count integer,
    location_lat double precision,
    location_lng double precision,
    last_active_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        g.name,
        g.description,
        g.member_count,
        (g.location->>'coordinates'::text)->>1::double precision as location_lat,
        (g.location->>'coordinates'::text)->>0::double precision as location_lng,
        g.last_active_at
    FROM groups g
    WHERE g.location IS NOT NULL
    AND g.is_public = true
    AND ST_DWithin(
        g.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY g.member_count DESC
    LIMIT 50;
END;
$$;

-- Find nearby moment drops
CREATE OR REPLACE FUNCTION find_nearby_drops(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer DEFAULT 50000
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    drop_type text,
    lat double precision,
    lng double precision,
    location_name text,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    radius integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        md.id,
        md.title,
        md.description,
        md.drop_type,
        (md.location_coords->>'lat')::double precision as lat,
        (md.location_coords->>'lng')::double precision as lng,
        md.location_name,
        md.start_time,
        md.end_time,
        md.radius_meters as radius
    FROM moment_drops md
    WHERE md.start_time <= NOW()
    AND md.end_time >= NOW()
    AND md.location_coords IS NOT NULL
    AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(
            (md.location_coords->>'lng')::double precision,
            (md.location_coords->>'lat')::double precision
        ), 4326)::geography,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY md.created_at DESC
    LIMIT 30;
END;
$$;

-- Find nearby digital assets
CREATE OR REPLACE FUNCTION find_nearby_assets(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer DEFAULT 10000
)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    asset_type text,
    lat double precision,
    lng double precision,
    metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        da.id,
        da.name,
        da.description,
        da.asset_type,
        (da.location->>'coordinates'::text)->>1::double precision as lat,
        (da.location->>'coordinates'::text)->>0::double precision as lng,
        da.metadata
    FROM digital_assets da
    WHERE da.location IS NOT NULL
    AND da.is_claimed = false
    AND ST_DWithin(
        da.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY da.created_at DESC
    LIMIT 20;
END;
$$;

-- Get user's social role
CREATE OR REPLACE FUNCTION get_user_social_role(p_user_id uuid)
RETURNS TABLE (
    primary_role text,
    secondary_roles text[],
    role_points integer,
    role_level integer,
    connections_made integer,
    events_hosted integer,
    groups_led integer,
    badges_earned text[],
    streak_days integer,
    max_streak integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        usr.primary_role,
        usr.secondary_roles,
        usr.role_points,
        usr.role_level,
        usr.connections_made,
        usr.events_hosted,
        usr.groups_led,
        usr.badges_earned,
        usr.streak_days,
        usr.max_streak
    FROM user_social_roles usr
    WHERE usr.user_id = p_user_id;
END;
$$;

-- Get city energy state
CREATE OR REPLACE FUNCTION get_city_energy(
    p_city text,
    p_neighborhood text DEFAULT NULL
)
RETURNS TABLE (
    city text,
    neighborhood text,
    energy_type text,
    intensity double precision,
    active_users integer,
    events_count integer,
    timestamp timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ces.city,
        ces.neighborhood,
        ces.energy_type,
        ces.intensity,
        ces.active_users,
        ces.events_count,
        ces.timestamp
    FROM city_energy_states ces
    WHERE ces.city = p_city
    AND (p_neighborhood IS NULL OR ces.neighborhood = p_neighborhood)
    ORDER BY ces.timestamp DESC
    LIMIT 1;
END;
$$;

-- Get active moment drops count
CREATE OR REPLACE FUNCTION get_active_drops_count(p_lat double precision, p_lng double precision, p_radius integer DEFAULT 50000)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM moment_drops md
    WHERE md.start_time <= NOW()
    AND md.end_time >= NOW()
    AND md.location_coords IS NOT NULL
    AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(
            (md.location_coords->>'lng')::double precision,
            (md.location_coords->>'lat')::double precision
        ), 4326)::geography,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius
    );
    RETURN v_count;
END;
$$;
