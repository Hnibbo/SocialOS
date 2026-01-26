-- Comprehensive fix for all application errors
-- Migration: 20260117320000_fix_all_errors

-- 1. Fix get_feed_posts RPC function - ambiguous user_id reference
CREATE OR REPLACE FUNCTION public.get_feed_posts(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    display_name text,
    avatar_url text,
    content text,
    type text,
    created_at timestamp with time zone,
    likes_count bigint,
    comments_count bigint,
    is_liked boolean,
    media jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.user_id,
        up.display_name,
        up.avatar_url,
        p.content,
        p.type,
        p.created_at,
        (SELECT COUNT(*) FROM public.post_likes pl WHERE pl.post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM public.post_comments pc WHERE pc.post_id = p.id) as comments_count,
        EXISTS(SELECT 1 FROM public.post_likes pl2 WHERE pl2.post_id = p.id AND pl2.user_id = p_user_id) as is_liked,
        (SELECT jsonb_agg(jsonb_build_object(
            'url', pm.media_url,
            'type', pm.media_type,
            'thumbnail', pm.thumbnail_url
        ) ORDER BY pm.order_index)
        FROM public.post_media pm WHERE pm.post_id = p.id) as media
    FROM public.posts p
    JOIN public.user_profiles up ON up.id = p.user_id
    WHERE p.visibility = 'public'
    AND NOT p.is_archived
    AND (
        p.user_id = p_user_id
        OR EXISTS (SELECT 1 FROM public.user_follows uf WHERE uf.follower_id = p_user_id AND uf.following_id = p.user_id)
    )
    ORDER BY p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 2. Grant SELECT permissions on live_streams table
GRANT SELECT ON public.live_streams TO authenticated;
GRANT INSERT ON public.live_streams TO authenticated;
GRANT UPDATE ON public.live_streams TO authenticated;
GRANT DELETE ON public.live_streams TO authenticated;

-- 3. Grant SELECT permissions on stream_participants table
GRANT SELECT ON public.stream_participants TO authenticated;
GRANT INSERT ON public.stream_participants TO authenticated;
GRANT UPDATE ON public.stream_participants TO authenticated;
GRANT DELETE ON public.stream_participants TO authenticated;

-- 4. Re-create and grant permissions for streaming RPC functions
DROP FUNCTION IF EXISTS public.increment_stream_viewers(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.decrement_stream_viewers(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.increment_stream_viewers(stream_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.live_streams
    SET viewer_count = viewer_count + 1
    WHERE id = stream_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_stream_viewers(stream_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.live_streams
    SET viewer_count = GREATEST(0, viewer_count - 1)
    WHERE id = stream_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_stream_viewers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stream_viewers(uuid) TO authenticated;

-- 5. Re-create find_nearby_drops function with proper table references
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
        CASE WHEN md.location_coords IS NOT NULL THEN (md.location_coords->>'lat')::double precision ELSE NULL END as lat,
        CASE WHEN md.location_coords IS NOT NULL THEN (md.location_coords->>'lng')::double precision ELSE NULL END as lng,
        md.start_time,
        md.end_time,
        COALESCE(md.radius_meters, 500) as radius,
        md.location_name
    FROM public.moment_drops md
    WHERE md.start_time <= NOW() AND md.end_time >= NOW() AND md.location_coords IS NOT NULL
    AND ST_DWithin(
        ST_SetSRID(
            ST_MakePoint(
                (md.location_coords->>'lng')::double precision,
                (md.location_coords->>'lat')::double precision
            ),
            4326
        )::geography,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY md.created_at DESC
    LIMIT 30;
END;
$$;

-- 6. Re-create find_nearby_assets function with proper table references
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
    RETURN QUERY
    SELECT
        da.id,
        da.name,
        da.description,
        da.asset_type,
        CASE WHEN da.location IS NOT NULL THEN ST_Y(da.location::geometry) ELSE NULL END as lat,
        CASE WHEN da.location IS NOT NULL THEN ST_X(da.location::geometry) ELSE NULL END as lng,
        da.metadata
    FROM public.digital_assets da
    WHERE da.location IS NOT NULL AND (da.is_claimed = false OR da.is_claimed IS NULL)
    AND ST_DWithin(
        da.location,
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        p_radius_meters
    )
    ORDER BY da.created_at DESC
    LIMIT 20;
END;
$$;

-- Grant execute permissions for the newly recreated functions
GRANT EXECUTE ON FUNCTION public.find_nearby_drops(double precision, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_nearby_assets(double precision, double precision, integer) TO authenticated;

-- 7. Ensure user_preferences table has proper defaults and insert missing preferences
DO $$
BEGIN
    -- Check which columns exist and insert defaults for users who don't have them
    -- For schema with user_id as PK (older migrations)
    INSERT INTO public.user_preferences (user_id, theme_color, theme_mode, content_language, push_notifications, email_notifications)
    SELECT
        id,
        'cyan' as theme_color,
        'dark' as theme_mode,
        'en' as content_language,
        true as push_notifications,
        true as email_notifications
    FROM auth.users
    WHERE NOT EXISTS (
        SELECT 1 FROM public.user_preferences WHERE user_preferences.user_id = auth.users.id
    )
    ON CONFLICT (user_id) DO NOTHING;
END $$;

-- 8. Grant permissions on user_preferences  
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON user_preferences TO authenticated;
