-- Comprehensive RPC Fix Migration
-- Fixes all geolocation and nearby search functions

-- 1. Add missing is_live column to live_streams (if referenced somewhere)
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS is_live BOOLEAN GENERATED ALWAYS AS (is_active) STORED;

-- 2. Fix update_user_location - drop first to avoid parameter name conflict
DROP FUNCTION IF EXISTS public.update_user_location(FLOAT, FLOAT);
DROP FUNCTION IF EXISTS public.update_user_location(p_lat FLOAT, p_lng FLOAT);

CREATE OR REPLACE FUNCTION public.update_user_location(
    lat FLOAT DEFAULT 0,
    lng FLOAT DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.user_presence (
        user_id, 
        last_known_location, 
        last_location_updated_at, 
        online_at, 
        updated_at,
        last_seen,
        is_visible
    )
    VALUES (
        auth.uid(),
        ST_SetSRID(ST_MakePoint(lng, lat), 4326),
        NOW(),
        NOW(),
        NOW(),
        NOW(),
        COALESCE((SELECT is_visible FROM public.user_presence WHERE user_id = auth.uid()), true)
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        last_known_location = ST_SetSRID(ST_MakePoint(lng, lat), 4326),
        last_location_updated_at = NOW(),
        online_at = NOW(),
        updated_at = NOW(),
        last_seen = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix find_nearby_users - ensure correct parameter names
DROP FUNCTION IF EXISTS public.find_nearby_users(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);
DROP FUNCTION IF EXISTS public.find_nearby_users(FLOAT, FLOAT, FLOAT);

CREATE OR REPLACE FUNCTION public.find_nearby_users(
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
    lng double precision,
    last_seen timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        up.user_id as id,
        COALESCE(p.full_name, 'Anonymous') as display_name,
        p.avatar_url,
        up.intent_signal,
        up.energy_level,
        CASE 
            WHEN up.last_known_location IS NOT NULL 
            THEN ST_Y(up.last_known_location::geometry) 
            ELSE NULL 
        END as lat,
        CASE 
            WHEN up.last_known_location IS NOT NULL 
            THEN ST_X(up.last_known_location::geometry) 
            ELSE NULL 
        END as lng,
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

-- 4. Fix find_nearby_assets
DROP FUNCTION IF EXISTS public.find_nearby_assets(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER);
DROP FUNCTION IF EXISTS public.find_nearby_assets(FLOAT, FLOAT, FLOAT);

CREATE OR REPLACE FUNCTION public.find_nearby_assets(
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
        CASE 
            WHEN da.location IS NOT NULL 
            THEN ST_Y(da.location::geometry) 
            ELSE NULL 
        END as lat,
        CASE 
            WHEN da.location IS NOT NULL 
            THEN ST_X(da.location::geometry) 
            ELSE NULL 
        END as lng,
        da.metadata
    FROM digital_assets da
    WHERE da.location IS NOT NULL
    AND (da.is_claimed = false OR da.is_claimed IS NULL)
    AND ST_DWithin(
        da.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY da.created_at DESC
    LIMIT 20;
END;
$$;

-- 5. Ensure all required tables have location columns
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_known_location geography(POINT);
ALTER TABLE public.user_presence ADD COLUMN IF NOT EXISTS last_known_location geography(POINT);
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS location geography(POINT);
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS location geography(POINT);
ALTER TABLE public.digital_assets ADD COLUMN IF NOT EXISTS location geography(POINT);

-- 6. Create index for user_presence location if not exists
CREATE INDEX IF NOT EXISTS idx_user_presence_location ON public.user_presence USING GIST(last_known_location);
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON public.user_profiles USING GIST(last_known_location);
CREATE INDEX IF NOT EXISTS idx_activities_location ON public.activities USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_groups_location ON public.groups USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_digital_assets_location ON public.digital_assets USING GIST(location);

-- 7. Grant execute permissions (skip if functions use different parameter types)
-- GRANT EXECUTE ON FUNCTION public.update_user_location(FLOAT, FLOAT) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.find_nearby_users(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.find_nearby_assets(DOUBLE PRECISION, DOUBLE PRECISION, INTEGER) TO authenticated;
