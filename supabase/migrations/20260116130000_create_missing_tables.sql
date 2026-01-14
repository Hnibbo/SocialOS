-- DISABLE BROKEN RPC FUNCTIONS
-- The moment_drops and digital_assets tables exist but have incompatible schemas
-- We'll create stub functions that return empty results to prevent 400 errors

-- 1. Replace find_nearby_drops with stub
DROP FUNCTION IF EXISTS public.find_nearby_drops(double precision, double precision, integer);
CREATE OR REPLACE FUNCTION public.find_nearby_drops(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer
)
RETURNS TABLE (
    id uuid, title text, description text, drop_type text,
    location_lat double precision, location_lng double precision,
    start_time timestamp with time zone, end_time timestamp with time zone,
    radius integer, location_name text
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Return empty result set until schema is fixed
    RETURN;
END;
$$;

-- 2. Replace find_nearby_assets with stub
DROP FUNCTION IF EXISTS public.find_nearby_assets(double precision, double precision, integer);
CREATE OR REPLACE FUNCTION public.find_nearby_assets(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer
)
RETURNS TABLE (
    id uuid, name text, description text, asset_type text,
    location_lat double precision, location_lng double precision, metadata jsonb
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Return empty result set until schema is fixed
    RETURN;
END;
$$;

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.find_nearby_drops(double precision, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_assets(double precision, double precision, integer) TO authenticated;
