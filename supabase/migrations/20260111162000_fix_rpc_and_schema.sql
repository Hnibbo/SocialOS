-- Migration to Repair Schema and RPC Functions
-- Handles: Missing Tables, Ambiguous RPCs, and RLS conflicts

-- 0. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- 1. Ensure user_profiles table exists (Reference definitions)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    website TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    api_token UUID DEFAULT gen_random_uuid(), -- Ensure this exists for auth
    first_name TEXT,
    last_name TEXT,
    birth_date DATE,
    bio TEXT
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Ensure user_presence table exists
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_visible BOOLEAN DEFAULT true,
    last_known_location geography(Point, 4326),
    location_updated_at TIMESTAMP WITH TIME ZONE,
    lat DOUBLE PRECISION,
    long DOUBLE PRECISION,
    -- Add other columns as needed by your types, keeping it simple for now
    visibility_mode TEXT DEFAULT 'personal', 
    availability TEXT DEFAULT 'online'
);

-- Enable RLS on user_presence
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- 3. Recreate the 'profiles' View (Critical for legacy/frontend calls)
DROP VIEW IF EXISTS public.profiles;
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
    id,
    updated_at,
    username,
    full_name,
    first_name,
    last_name,
    avatar_url,
    website,
    api_token,
    birth_date,
    bio
FROM public.user_profiles;

-- 4. Fix RPC: update_user_location
-- Handles UPSERT logic to avoid 409 Conflicts
CREATE OR REPLACE FUNCTION public.update_user_location(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Upsert presence
    INSERT INTO public.user_presence (
        user_id, 
        lat, 
        long, 
        last_known_location, 
        location_updated_at, 
        last_seen
    )
    VALUES (
        current_user_id,
        lat,
        lng,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        lat = EXCLUDED.lat,
        long = EXCLUDED.long,
        last_known_location = EXCLUDED.last_known_location,
        location_updated_at = EXCLUDED.location_updated_at,
        last_seen = EXCLUDED.last_seen;
END;
$$;

-- 5. Fix RPC: find_nearby_users
-- Explicit types to resolve PGRST203 ambiguity
-- Returns table structure matching frontend expectation
DROP FUNCTION IF EXISTS public.find_nearby_users(uuid, float, int);
DROP FUNCTION IF EXISTS public.find_nearby_users(uuid, double precision, int); 

CREATE OR REPLACE FUNCTION public.find_nearby_users(
    p_user_id UUID,
    p_radius_meters DOUBLE PRECISION,
    p_limit INTEGER
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    lat DOUBLE PRECISION,
    long DOUBLE PRECISION,
    dist_meters DOUBLE PRECISION,
    last_seen TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id AS id,
        prof.username,
        prof.full_name,
        prof.avatar_url,
        up.lat,
        up.long,
        ST_Distance(
            up.last_known_location,
            (SELECT last_known_location FROM public.user_presence WHERE user_id = p_user_id)
        ) AS dist_meters,
        up.last_seen
    FROM 
        public.user_presence up
    JOIN 
        public.user_profiles prof ON up.user_id = prof.id
    WHERE 
        up.user_id != p_user_id
        AND up.is_visible = true
        AND ST_DWithin(
            up.last_known_location,
            (SELECT last_known_location FROM public.user_presence WHERE user_id = p_user_id),
            p_radius_meters
        )
    ORDER BY 
        dist_meters ASC
    LIMIT p_limit;
END;
$$;

-- 6. Grant Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public.user_profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_presence TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;

-- Policies (Simplified for immediate fix, refine later)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.user_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" 
ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "User presence viewable by everyone" ON public.user_presence;
CREATE POLICY "User presence viewable by everyone" 
ON public.user_presence FOR SELECT USING (true); -- Filtered by logic usually, but strict RLS OK to be open for now if is_visible checked in app

DROP POLICY IF EXISTS "Users can manage own presence" ON public.user_presence;
CREATE POLICY "Users can manage own presence" 
ON public.user_presence FOR ALL USING (auth.uid() = user_id);
