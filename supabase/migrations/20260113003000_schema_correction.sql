-- Migration: Correct Schema Fix (Table vs View)

-- 1. Add api_token to the REAL table (user_profiles)
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS api_token TEXT UNIQUE;

-- 2. Update the 'profiles' VIEW to expose this new column
-- (Assuming 'profiles' view is currently: SELECT ... FROM user_profiles)
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
    up.id,
    up.username,
    up.full_name,
    up.avatar_url,
    up.website,
    up.updated_at,
    up.api_token -- Exposure
FROM public.user_profiles up;

-- 3. Also ensure we have a view that joins presence for the Streams feature
-- The frontend for streams queries 'user_profiles' via FK 'host:user_profiles!host_id'.
-- If 'user_profiles' is a TABLE, we can't easily add calculated 'location' columns to it permanently without triggers or a generated column,
-- OR we can create a specific view for streams like 'stream_hosts'.
-- BUT the frontend query explicitly asks for 'user_profiles!host_id(location_lat...)'.
-- This implies the relation name 'user_profiles' must have those columns.
-- If 'user_profiles' is a table, we can't make it a view. 
-- WE MUST creating a COMPUTED COLUMN (Function) for location on the user_profiles table.

-- Computed columns for Location (so they appear as fields in Graph/API)
CREATE OR REPLACE FUNCTION public.location_lat(up public.user_profiles)
RETURNS DOUBLE PRECISION AS $$
    SELECT ST_Y(pres.last_known_location::geometry)
    FROM public.user_presence pres
    WHERE pres.user_id = up.id;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.location_lng(up public.user_profiles)
RETURNS DOUBLE PRECISION AS $$
    SELECT ST_X(pres.last_known_location::geometry)
    FROM public.user_presence pres
    WHERE pres.user_id = up.id;
$$ LANGUAGE sql STABLE;

-- Grant access to everything
GRANT SELECT ON public.user_profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.location_lat(public.user_profiles) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.location_lng(public.user_profiles) TO anon, authenticated;
