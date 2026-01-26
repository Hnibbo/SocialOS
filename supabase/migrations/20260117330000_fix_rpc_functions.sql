-- Fix all RPC function issues
-- Migration: 20260117330000_fix_rpc_functions

-- 1. Fix get_user_conversations function - ambiguous column reference 'id'
DROP FUNCTION IF EXISTS public.get_user_conversations(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    type text,
    name text,
    avatar_url text,
    last_message_at timestamp with time zone,
    unread_count bigint,
    last_message_content text,
    last_message_sender_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.type,
        COALESCE(c.name, 
            (SELECT display_name FROM public.user_profiles 
             WHERE id = (SELECT user_id FROM public.conversation_participants 
                        WHERE conversation_id = c.id AND user_id != p_user_id LIMIT 1))
        ) as name,
        COALESCE(c.avatar_url,
            (SELECT avatar_url FROM public.user_profiles 
             WHERE id = (SELECT user_id FROM public.conversation_participants 
                        WHERE conversation_id = c.id AND user_id != p_user_id LIMIT 1))
        ) as avatar_url,
        c.last_message_at,
        (SELECT COUNT(*) FROM public.messages m
         WHERE m.conversation_id = c.id
         AND m.created_at > cp.last_read_at
         AND m.sender_id != p_user_id) as unread_count,
        (SELECT content FROM public.messages 
         WHERE conversation_id = c.id 
         ORDER BY created_at DESC LIMIT 1) as last_message_content,
        (SELECT sender_id FROM public.messages 
         WHERE conversation_id = c.id 
         ORDER BY created_at DESC LIMIT 1) as last_message_sender_id
    FROM public.conversations c
    JOIN public.conversation_participants cp ON cp.conversation_id = c.id
    WHERE cp.user_id = p_user_id
    ORDER BY c.last_message_at DESC;
END;
$$;

-- 2. Fix find_nearby_drops function - use correct column names (location_lat/location_lng instead of location_coords)
DROP FUNCTION IF EXISTS public.find_nearby_drops(double precision, double precision, integer) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_drops(float, float, integer) CASCADE;

CREATE OR REPLACE FUNCTION public.find_nearby_drops(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer
)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    drop_type text,
    lat double precision,
    lng double precision,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    radius integer,
    location_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        md.id,
        md.title,
        md.description,
        md.drop_type,
        md.location_lat::double precision as lat,
        md.location_lng::double precision as lng,
        md.start_time,
        md.end_time,
        COALESCE(md.radius_meters, 500) as radius,
        NULL::text as location_name
    FROM public.moment_drops md
    WHERE md.start_time <= NOW() AND md.end_time >= NOW() 
    AND md.location_lat IS NOT NULL AND md.location_lng IS NOT NULL
    AND ST_DWithin(
        ST_SetSRID(
            ST_MakePoint(
                md.location_lng::double precision,
                md.location_lat::double precision
            ),
            4326
        )::geography,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY md.start_time DESC
    LIMIT 30;
END;
$$;

-- 3. Fix find_nearby_assets function - use correct column names (location_lat/location_lng instead of location geometry)
DROP FUNCTION IF EXISTS public.find_nearby_assets(double precision, double precision, integer) CASCADE;
DROP FUNCTION IF EXISTS public.find_nearby_assets(float, float, integer) CASCADE;

CREATE OR REPLACE FUNCTION public.find_nearby_assets(
    p_lat double precision,
    p_lng double precision,
    p_radius_meters integer
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
SET search_path = public
AS $$
BEGIN
    -- Add missing columns to digital_assets table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'digital_assets' AND column_name = 'location_lat') THEN
        ALTER TABLE public.digital_assets ADD COLUMN location_lat DECIMAL(10,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'digital_assets' AND column_name = 'location_lng') THEN
        ALTER TABLE public.digital_assets ADD COLUMN location_lng DECIMAL(10,8);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'digital_assets' AND column_name = 'is_claimed') THEN
        ALTER TABLE public.digital_assets ADD COLUMN is_claimed BOOLEAN DEFAULT FALSE;
    END IF;
    
    RETURN QUERY
    SELECT
        da.id,
        da.name,
        da.description,
        da.asset_type,
        da.location_lat::double precision as lat,
        da.location_lng::double precision as lng,
        da.metadata
    FROM public.digital_assets da
    WHERE da.location_lat IS NOT NULL AND da.location_lng IS NOT NULL
    AND (da.is_claimed = false OR da.is_claimed IS NULL)
    AND ST_DWithin(
        ST_SetSRID(
            ST_MakePoint(
                da.location_lng::double precision,
                da.location_lat::double precision
            ),
            4326
        )::geography,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY da.created_at DESC
    LIMIT 20;
END;
$$;

-- Grant execute permissions for all functions
GRANT EXECUTE ON FUNCTION public.get_user_conversations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_drops(double precision, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_assets(double precision, double precision, integer) TO authenticated;

-- Verify all functions are created correctly
SELECT proname, proargtypes, prosrc FROM pg_proc 
WHERE proname IN ('get_user_conversations', 'find_nearby_drops', 'find_nearby_assets') 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
