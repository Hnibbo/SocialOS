-- Migration: Groups & Communities (Idempotent)
-- Defines the schema for Social Groups and Geolocation Search

-- 1. Groups Table (Update existing if needed)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add columns if they missed (Idempotency)
DO $$
BEGIN
    ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS banner_url TEXT;
    ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS privacy TEXT CHECK (privacy IN ('public', 'private', 'secret')) DEFAULT 'public';
    ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
    ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;
    ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 1;
END $$;

-- 2. Group Members
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'admin', 'moderator', 'member')) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (group_id, user_id)
);

-- 3. RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Groups Policies
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.groups;
CREATE POLICY "Public groups are viewable by everyone" ON public.groups
    FOR SELECT USING (privacy = 'public');

DROP POLICY IF EXISTS "Members can view private groups" ON public.groups;
CREATE POLICY "Members can view private groups" ON public.groups
    FOR SELECT USING (
        privacy = 'private' AND (
            EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Owners/Admins can update groups" ON public.groups;
CREATE POLICY "Owners/Admins can update groups" ON public.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Members Policies
DROP POLICY IF EXISTS "Group members are viewable by everyone" ON public.group_members;
CREATE POLICY "Group members are viewable by everyone" ON public.group_members
    FOR SELECT USING (true); -- Simplified visibility

DROP POLICY IF EXISTS "Users can join public groups" ON public.group_members;
CREATE POLICY "Users can join public groups" ON public.group_members
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM public.groups WHERE id = group_id AND privacy = 'public')
    );

-- 4. Geolocation RPC: Find Nearby Groups
DROP FUNCTION IF EXISTS public.find_nearby_groups(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);

CREATE OR REPLACE FUNCTION public.find_nearby_groups(
    p_lat DOUBLE PRECISION,
    p_long DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    avatar_url TEXT,
    member_count INTEGER,
    lat DOUBLE PRECISION,
    long DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION
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
        g.avatar_url,
        g.member_count,
        g.location_lat AS lat,
        g.location_lng AS long,
        (
            6371000 * acos(
                cos(radians(p_lat)) * cos(radians(g.location_lat)) *
                cos(radians(g.location_lng) - radians(p_long)) +
                sin(radians(p_lat)) * sin(radians(g.location_lat))
            )
        ) AS distance_meters
    FROM
        public.groups g
    WHERE
        g.location_lat IS NOT NULL 
        AND g.location_lng IS NOT NULL
        AND (
            6371000 * acos(
                cos(radians(p_lat)) * cos(radians(g.location_lat)) *
                cos(radians(g.location_lng) - radians(p_long)) +
                sin(radians(p_lat)) * sin(radians(g.location_lat))
            )
        ) < p_radius_meters
    ORDER BY
        distance_meters ASC;
END;
$$;
