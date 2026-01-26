


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";








ALTER SCHEMA "public" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "stripe";


ALTER SCHEMA "stripe" OWNER TO "postgres";


COMMENT ON SCHEMA "stripe" IS 'stripe-sync v1.0.18 installed';



CREATE EXTENSION IF NOT EXISTS "btree_gist" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."content_type" AS ENUM (
    'reel',
    'photo',
    'text',
    'story',
    'live'
);


ALTER TYPE "public"."content_type" OWNER TO "postgres";


CREATE TYPE "public"."moderation_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'flagged'
);


ALTER TYPE "public"."moderation_status" OWNER TO "postgres";


CREATE TYPE "public"."subscription_tier" AS ENUM (
    'free',
    'basic',
    'premium',
    'creator',
    'business'
);


ALTER TYPE "public"."subscription_tier" OWNER TO "postgres";


CREATE TYPE "public"."user_availability" AS ENUM (
    'available',
    'busy',
    'invisible',
    'do_not_disturb'
);


ALTER TYPE "public"."user_availability" OWNER TO "postgres";


CREATE TYPE "stripe"."invoice_status" AS ENUM (
    'draft',
    'open',
    'paid',
    'uncollectible',
    'void',
    'deleted'
);


ALTER TYPE "stripe"."invoice_status" OWNER TO "postgres";


CREATE TYPE "stripe"."pricing_tiers" AS ENUM (
    'graduated',
    'volume'
);


ALTER TYPE "stripe"."pricing_tiers" OWNER TO "postgres";


CREATE TYPE "stripe"."pricing_type" AS ENUM (
    'one_time',
    'recurring'
);


ALTER TYPE "stripe"."pricing_type" OWNER TO "postgres";


CREATE TYPE "stripe"."subscription_schedule_status" AS ENUM (
    'not_started',
    'active',
    'completed',
    'released',
    'canceled'
);


ALTER TYPE "stripe"."subscription_schedule_status" OWNER TO "postgres";


CREATE TYPE "stripe"."subscription_status" AS ENUM (
    'trialing',
    'active',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'past_due',
    'unpaid',
    'paused'
);


ALTER TYPE "stripe"."subscription_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_ban_user"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
   IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Admin only';
  END IF;

  INSERT INTO banned_users (user_id, banned_by, reason)
  VALUES (target_user_id, auth.uid(), 'Admin manual ban')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Also hide profile
  UPDATE user_profiles
  SET is_visible = false
  WHERE id = target_user_id;
END;
$$;


ALTER FUNCTION "public"."admin_ban_user"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_deactivate_user"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Check if caller is admin (optional, can be enforcing via RLS or logic)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Admin only';
  END IF;

  -- Soft delete profile
  UPDATE user_profiles
  SET is_visible = false,
      is_suspended = true
  WHERE id = target_user_id;

  -- Terminate sessions implies auth.users update but we can't do that easily from here without pg_net or extensive setup.
  -- RLS policies will handle the rest (user won't be able to query tables).
END;
$$;


ALTER FUNCTION "public"."admin_deactivate_user"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."array_intersect"("anyarray", "anyarray") RETURNS "anyarray"
    LANGUAGE "sql"
    AS $_$
    SELECT ARRAY(
        SELECT UNNEST($1)
        INTERSECT
        SELECT UNNEST($2)
    );
$_$;


ALTER FUNCTION "public"."array_intersect"("anyarray", "anyarray") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_dating_match"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  reverse_swipe RECORD;
BEGIN
  IF NEW.direction = 'right' OR NEW.direction = 'super' THEN
    SELECT * INTO reverse_swipe FROM dating_swipes
    WHERE swiper_id = NEW.swiped_id
      AND swiped_id = NEW.swiper_id
      AND direction IN ('right', 'super')
      AND context = NEW.context;
    
    IF FOUND THEN
      INSERT INTO dating_matches (user1_id, user2_id, context, context_id)
      VALUES (
        LEAST(NEW.swiper_id, NEW.swiped_id),
        GREATEST(NEW.swiper_id, NEW.swiped_id),
        NEW.context,
        NEW.context_id
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_dating_match"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_for_match"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if counter-swipe exists (Right or Super only)
    IF (NEW.direction IN ('right', 'super')) THEN
        IF EXISTS (
            SELECT 1 FROM dating_swipes 
            WHERE swiper_id = NEW.swiped_id 
            AND swiped_id = NEW.swiper_id 
            AND direction IN ('right', 'super')
        ) THEN
            -- INSERT MATCH
            INSERT INTO public.matches (user1_id, user2_id)
            VALUES (LEAST(NEW.swiper_id, NEW.swiped_id), GREATEST(NEW.swiper_id, NEW.swiped_id))
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_for_match"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_invalid_tokens"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM public.push_tokens WHERE created_at < now() - INTERVAL '30 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_invalid_tokens"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_location_history"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  DELETE FROM location_history WHERE recorded_at < now() - interval '24 hours';
END;
$$;


ALTER FUNCTION "public"."cleanup_location_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_stream_viewers"("stream_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.live_streams
    SET viewer_count = GREATEST(0, viewer_count - 1)
    WHERE id = stream_id;
END;
$$;


ALTER FUNCTION "public"."decrement_stream_viewers"("stream_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_best_matches"("p_latitude" double precision, "p_longitude" double precision, "p_radius_meters" double precision DEFAULT 50000, "p_limit" integer DEFAULT 20) RETURNS TABLE("user_id" "uuid", "full_name" "text", "username" "text", "avatar_url" "text", "age" integer, "bio" "text", "match_score" double precision, "distance_meters" double precision, "shared_interests" "text"[])
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_user_interests text[];
BEGIN
  -- Get current user interests
  SELECT dating_profiles.interests INTO current_user_interests
  FROM dating_profiles
  WHERE dating_profiles.user_id = auth.uid();

  RETURN QUERY
  SELECT
    dating_profiles.user_id,
    user_profiles.full_name,
    user_profiles.username,
    user_profiles.avatar_url,
    dating_profiles.age,
    dating_profiles.bio,
    (
      -- Scoring Algorithm
      (100 * (1 - (st_distance(
        st_point(p_longitude, p_latitude)::geography,
        st_point(dating_profiles.location_lng, dating_profiles.location_lat)::geography
      ) / p_radius_meters))) + -- Distance weight (0-100)

      (cardinality(array_intersect(dating_profiles.interests, current_user_interests)) * 10) + -- Interest weight (10 pts per match)

      (CASE WHEN dating_profiles.is_verified THEN 20 ELSE 0 END) -- Verification bonus
    )::float as match_score,

    st_distance(
      st_point(p_longitude, p_latitude)::geography,
      st_point(dating_profiles.location_lng, dating_profiles.location_lat)::geography
    ) as distance_meters,

    array_intersect(dating_profiles.interests, current_user_interests) as shared_interests

  FROM dating_profiles
  JOIN user_profiles ON dating_profiles.user_id = user_profiles.id
  WHERE
    dating_profiles.user_id != auth.uid()
    AND dating_profiles.is_visible = true
    AND st_dwithin(
      st_point(dating_profiles.location_lng, dating_profiles.location_lat)::geography,
      st_point(p_longitude, p_latitude)::geography,
      p_radius_meters
    )
    AND NOT EXISTS ( -- Exclude previously swiped
      SELECT 1 FROM dating_swipes ds
      WHERE ds.swiper_id = auth.uid() AND ds.swiped_id = dating_profiles.user_id
    )
  ORDER BY match_score DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."find_best_matches"("p_latitude" double precision, "p_longitude" double precision, "p_radius_meters" double precision, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_activities"("lat" double precision, "lng" double precision, "radius_meters" double precision DEFAULT 50000) RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "activity_type" "text", "location_lat" double precision, "location_lng" double precision, "start_time" timestamp with time zone, "distance_meters" double precision)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.title,
        a.description,
        a.activity_type,
        -- Handle both Geometry column AND separate lat/lng columns if they exist. 
        -- Prioritize Geometry if populated, else falls back.
        -- Assuming 'activities' uses PostGIS geometry based on previous migration (20260111160000)
        ST_Y(a.location::geometry) AS location_lat,
        ST_X(a.location::geometry) AS location_lng,
        a.start_time,
        ST_Distance(
            a.location, 
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        ) AS distance_meters
    FROM public.activities a
    WHERE 
        a.status = 'active'
        AND ST_DWithin(
            a.location, 
            ST_SetSRID(ST_MakePoint(lng, lat), 4326), 
            radius_meters
        )
    ORDER BY distance_meters ASC
    LIMIT 50;
END;
$$;


ALTER FUNCTION "public"."find_nearby_activities"("lat" double precision, "lng" double precision, "radius_meters" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_activities"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "activity_type" "text", "location_lat" double precision, "location_lng" double precision, "start_time" timestamp with time zone, "end_time" timestamp with time zone, "location_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id, a.title, a.description, a.activity_type,
        CASE WHEN a.location IS NOT NULL THEN ST_Y(a.location::geometry) ELSE NULL END as location_lat,
        CASE WHEN a.location IS NOT NULL THEN ST_X(a.location::geometry) ELSE NULL END as location_lng,
        a.start_time, a.end_time, a.location_name
    FROM public.activities a
    WHERE a.status = 'active' AND a.start_time >= NOW() AND a.location IS NOT NULL
    AND ST_DWithin(a.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
    ORDER BY a.start_time ASC LIMIT 50;
END;
$$;


ALTER FUNCTION "public"."find_nearby_activities"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_activities"("p_location" "public"."geography", "p_radius_meters" integer DEFAULT 10000, "p_limit" integer DEFAULT 20) RETURNS TABLE("id" "uuid", "title" "text", "activity_type" "text", "distance_meters" double precision, "start_time" timestamp with time zone, "current_attendees" integer, "is_free" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.activity_type,
    ST_Distance(a.location, p_location)::FLOAT,
    a.start_time,
    a.current_attendees,
    a.is_free
  FROM activities a
  WHERE a.status = 'active'
    AND a.start_time > now()
    AND a.is_public = true
    AND ST_DWithin(a.location, p_location, p_radius_meters)
  ORDER BY a.start_time
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."find_nearby_activities"("p_location" "public"."geography", "p_radius_meters" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_activities"("p_lat" double precision, "p_long" double precision, "p_radius_meters" double precision, "p_limit" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "activity_type" "text", "location_name" "text", "lat" double precision, "long" double precision, "distance_meters" double precision, "expires_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."find_nearby_activities"("p_lat" double precision, "p_long" double precision, "p_radius_meters" double precision, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_assets"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) RETURNS TABLE("id" "uuid", "name" "text", "description" "text", "asset_type" "text", "location_lat" double precision, "location_lng" double precision, "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Return empty result set until schema is fixed
    RETURN;
END;
$$;


ALTER FUNCTION "public"."find_nearby_assets"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_drops"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "drop_type" "text", "location_lat" double precision, "location_lng" double precision, "start_time" timestamp with time zone, "end_time" timestamp with time zone, "radius" integer, "location_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Return empty result set until schema is fixed
    RETURN;
END;
$$;


ALTER FUNCTION "public"."find_nearby_drops"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_groups"("p_lat" double precision, "p_long" double precision, "p_radius_meters" double precision) RETURNS TABLE("id" "uuid", "name" "text", "description" "text", "avatar_url" "text", "member_count" integer, "lat" double precision, "long" double precision, "distance_meters" double precision)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
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


ALTER FUNCTION "public"."find_nearby_groups"("p_lat" double precision, "p_long" double precision, "p_radius_meters" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_groups"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) RETURNS TABLE("id" "uuid", "name" "text", "description" "text", "member_count" integer, "location_lat" double precision, "location_lng" double precision, "cover_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT g.id, g.name, g.description, g.member_count,
        CASE WHEN g.location IS NOT NULL THEN ST_Y(g.location::geometry) ELSE NULL END as location_lat,
        CASE WHEN g.location IS NOT NULL THEN ST_X(g.location::geometry) ELSE NULL END as location_lng,
        g.cover_url
    FROM public.groups g
    WHERE g.location IS NOT NULL AND g.is_public = true
    AND ST_DWithin(g.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_radius_meters)
    ORDER BY g.member_count DESC LIMIT 50;
END;
$$;


ALTER FUNCTION "public"."find_nearby_groups"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_groups"("p_lat" double precision, "p_long" double precision, "p_radius_meters" double precision, "p_limit" integer DEFAULT 50) RETURNS TABLE("id" "uuid", "name" "text", "description" "text", "avatar_url" "text", "member_count" integer, "lat" double precision, "long" double precision, "distance_meters" double precision)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."find_nearby_groups"("p_lat" double precision, "p_long" double precision, "p_radius_meters" double precision, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_users"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) RETURNS TABLE("id" "uuid", "display_name" "text", "avatar_url" "text", "intent_signal" "text", "energy_level" integer, "location_lat" double precision, "location_lng" double precision, "last_seen" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id as id,
        COALESCE(p.display_name, 'Anonymous') as display_name,
        p.avatar_url,
        NULL::text as intent_signal,  -- Column doesn't exist, return NULL
        0 as energy_level,  -- Column doesn't exist, return 0
        CASE WHEN up.last_known_location IS NOT NULL THEN ST_Y(up.last_known_location::geometry) ELSE NULL END as location_lat,
        CASE WHEN up.last_known_location IS NOT NULL THEN ST_X(up.last_known_location::geometry) ELSE NULL END as location_lng,
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


ALTER FUNCTION "public"."find_nearby_users"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_users"("p_user_id" "uuid", "p_radius_meters" double precision, "p_limit" integer) RETURNS TABLE("id" "uuid", "username" "text", "full_name" "text", "avatar_url" "text", "lat" double precision, "long" double precision, "dist_meters" double precision, "last_seen" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
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


ALTER FUNCTION "public"."find_nearby_users"("p_user_id" "uuid", "p_radius_meters" double precision, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_nearby_users"("p_user_id" "uuid", "p_radius_meters" integer DEFAULT 5000, "p_limit" integer DEFAULT 50) RETURNS TABLE("user_id" "uuid", "distance_meters" double precision, "display_name" "text", "avatar_url" "text", "availability" "public"."user_availability", "intent_icons" "text"[], "anonymous_mode" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_location GEOGRAPHY;
BEGIN
  SELECT location INTO user_location FROM user_presence WHERE user_presence.user_id = p_user_id;
  
  IF user_location IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    up.user_id,
    ST_Distance(up.location, user_location)::FLOAT as distance_meters,
    pr.display_name,
    pr.avatar_url,
    up.availability,
    up.intent_icons,
    up.anonymous_mode
  FROM user_presence up
  JOIN user_profiles pr ON pr.id = up.user_id
  WHERE up.user_id != p_user_id
    AND up.is_visible = true
    AND up.availability != 'invisible'
    AND ST_DWithin(up.location, user_location, p_radius_meters)
    AND (up.presence_expires_at IS NULL OR up.presence_expires_at > now())
  ORDER BY ST_Distance(up.location, user_location)
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."find_nearby_users"("p_user_id" "uuid", "p_radius_meters" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."find_random_connection"("p_user_id" "uuid", "p_connection_type" "text", "p_location" "public"."geography", "p_nearby_only" boolean, "p_radius_km" integer) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  matched_user_id UUID;
  matched_queue_id UUID;
BEGIN
  IF p_nearby_only THEN
    SELECT rcq.id, rcq.user_id INTO matched_queue_id, matched_user_id
    FROM random_connect_queue rcq
    WHERE rcq.user_id != p_user_id
      AND rcq.connection_type = p_connection_type
      AND rcq.expires_at > now()
      AND ST_DWithin(rcq.location, p_location, p_radius_km * 1000)
    ORDER BY ST_Distance(rcq.location, p_location)
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  ELSE
    SELECT rcq.id, rcq.user_id INTO matched_queue_id, matched_user_id
    FROM random_connect_queue rcq
    WHERE rcq.user_id != p_user_id
      AND rcq.connection_type = p_connection_type
      AND rcq.expires_at > now()
    ORDER BY random()
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;
  
  IF matched_queue_id IS NOT NULL THEN
    DELETE FROM random_connect_queue WHERE id = matched_queue_id;
  END IF;
  
  RETURN matched_user_id;
END;
$$;


ALTER FUNCTION "public"."find_random_connection"("p_user_id" "uuid", "p_connection_type" "text", "p_location" "public"."geography", "p_nearby_only" boolean, "p_radius_km" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_streams_on_map"() RETURNS TABLE("id" "uuid", "title" "text", "host_id" "uuid", "location_lat" double precision, "location_lng" double precision, "avatar_url" "text", "username" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.title,
        s.host_id,
        ST_Y(up.last_known_location::geometry) as location_lat,
        ST_X(up.last_known_location::geometry) as location_lng,
        p.avatar_url,
        p.display_name as username
    FROM public.live_streams s
    JOIN public.user_presence up ON s.host_id = up.user_id
    JOIN public.user_profiles p ON s.host_id = p.id
    WHERE s.is_active = true
    AND up.last_known_location IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."get_active_streams_on_map"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Also init wallet
  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0.00);
  
  -- Also init dating profile (hidden by default)
  INSERT INTO public.dating_profiles (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_stream_viewers"("stream_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.live_streams
    SET viewer_count = viewer_count + 1
    WHERE id = stream_id;
END;
$$;


ALTER FUNCTION "public"."increment_stream_viewers"("stream_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_user_preferences"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.user_identity (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_user_preferences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new._updated_at = now();
  return NEW;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at_metadata"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return NEW;
end;
$$;


ALTER FUNCTION "public"."set_updated_at_metadata"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_stripe_price_to_plans"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- This assumes monthly/yearly prices map to our local columns
    -- In a real scenario, you'd match by product_id and metadata
    UPDATE public.subscription_plans
    SET 
        price_monthly = CASE WHEN new.interval = 'month' THEN (new.unit_amount / 100.0) ELSE price_monthly END,
        price_yearly = CASE WHEN new.interval = 'year' THEN (new.unit_amount / 100.0) ELSE price_yearly END,
        stripe_price_monthly = CASE WHEN new.interval = 'month' THEN new.id ELSE stripe_price_monthly END,
        stripe_price_yearly = CASE WHEN new.interval = 'year' THEN new.id ELSE stripe_price_yearly END
    WHERE stripe_product_id = new.product_id;
    RETURN new;
END;
$$;


ALTER FUNCTION "public"."sync_stripe_price_to_plans"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_stripe_product_to_plans"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.subscription_plans (
        name,
        slug,
        description,
        stripe_product_id,
        is_active,
        updated_at
    )
    VALUES (
        new.name,
        COALESCE(new.metadata->>'slug', lower(replace(new.name, ' ', '-'))),
        new.description,
        new.id,
        new.active,
        now()
    )
    ON CONFLICT (stripe_product_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = now();
    RETURN new;
END;
$$;


ALTER FUNCTION "public"."sync_stripe_product_to_plans"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_stripe_subscription_to_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
    v_plan_id UUID;
BEGIN
    -- Get user_id from metadata or lookup
    v_user_id := (new.metadata->>'user_id')::UUID;
    
    -- Get local plan_id from stripe_product_id
    SELECT id INTO v_plan_id FROM public.subscription_plans WHERE stripe_product_id = (SELECT product_id FROM stripe.prices WHERE id = new.price_id);

    IF v_user_id IS NOT NULL AND v_plan_id IS NOT NULL THEN
        INSERT INTO public.user_subscriptions (
            user_id,
            plan_id,
            status,
            started_at,
            expires_at
        )
        VALUES (
            v_user_id,
            v_plan_id,
            new.status,
            new.current_period_start,
            new.current_period_end
        )
        ON CONFLICT (user_id) DO UPDATE SET
            plan_id = EXCLUDED.plan_id,
            status = EXCLUDED.status,
            started_at = EXCLUDED.started_at,
            expires_at = EXCLUDED.expires_at;
    END IF;
    RETURN new;
END;
$$;


ALTER FUNCTION "public"."sync_stripe_subscription_to_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_activity_attendee_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE activities SET current_attendees = current_attendees + 1, updated_at = now() WHERE id = NEW.activity_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE activities SET current_attendees = current_attendees - 1, updated_at = now() WHERE id = OLD.activity_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_activity_attendee_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_content_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE content SET likes_count = likes_count + 1 WHERE id = NEW.content_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE content SET likes_count = likes_count - 1 WHERE id = OLD.content_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_content_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_follower_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE user_profiles SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
    UPDATE user_profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE user_profiles SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
    UPDATE user_profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_follower_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_group_member_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1, updated_at = now() WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = member_count - 1, updated_at = now() WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_group_member_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_location"("lat" double precision, "lng" double precision) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.user_presence (user_id, last_known_location, last_location_updated_at, online_at, updated_at, last_seen, is_visible)
    VALUES (auth.uid(), ST_SetSRID(ST_MakePoint(lng, lat), 4326), NOW(), NOW(), NOW(), NOW(),
        COALESCE((SELECT is_visible FROM public.user_presence WHERE user_id = auth.uid()), true))
    ON CONFLICT (user_id) DO UPDATE SET 
        last_known_location = ST_SetSRID(ST_MakePoint(lng, lat), 4326),
        last_location_updated_at = NOW(), online_at = NOW(), updated_at = NOW(), last_seen = NOW();
END;
$$;


ALTER FUNCTION "public"."update_user_location"("lat" double precision, "lng" double precision) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_subscription"("p_user_id" "uuid", "p_stripe_customer_id" "text", "p_stripe_subscription_id" "text", "p_tier" "text", "p_status" "text", "p_start" timestamp with time zone, "p_end" timestamp with time zone) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        stripe_customer_id = p_stripe_customer_id,
        stripe_subscription_id = p_stripe_subscription_id,
        subscription_tier = p_tier,
        subscription_status = p_status,
        subscription_start = p_start,
        subscription_end = p_end,
        updated_at = now()
    WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."update_user_subscription"("p_user_id" "uuid", "p_stripe_customer_id" "text", "p_stripe_subscription_id" "text", "p_tier" "text", "p_status" "text", "p_start" timestamp with time zone, "p_end" timestamp with time zone) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "requirement_type" "text" NOT NULL,
    "requirement_threshold" integer NOT NULL,
    "requirement_data" "jsonb" DEFAULT '{}'::"jsonb",
    "xp_reward" integer DEFAULT 0,
    "badge_id" "text",
    "asset_reward" "uuid",
    "icon" "text",
    "rarity" "text" DEFAULT 'common'::"text",
    "sort_order" integer DEFAULT 0,
    "is_secret" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid",
    "group_id" "uuid",
    "business_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "cover_url" "text",
    "activity_type" "text" NOT NULL,
    "category" "text",
    "location" "public"."geography"(Point,4326),
    "location_name" "text",
    "location_address" "jsonb",
    "is_virtual" boolean DEFAULT false,
    "virtual_link" "text",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone,
    "timezone" "text" DEFAULT 'UTC'::"text",
    "is_recurring" boolean DEFAULT false,
    "recurrence_rule" "text",
    "max_attendees" integer,
    "current_attendees" integer DEFAULT 0,
    "waitlist_enabled" boolean DEFAULT false,
    "waitlist_count" integer DEFAULT 0,
    "rsvp_required" boolean DEFAULT false,
    "is_free" boolean DEFAULT true,
    "cost_amount" numeric(10,2),
    "cost_currency" "text" DEFAULT 'USD'::"text",
    "stripe_price_id" "text",
    "vibe_tags" "text"[] DEFAULT '{}'::"text"[],
    "interests" "text"[] DEFAULT '{}'::"text"[],
    "age_min" integer DEFAULT 18,
    "age_max" integer DEFAULT 99,
    "gender_filter" "text",
    "is_public" boolean DEFAULT true,
    "is_anonymous" boolean DEFAULT false,
    "allow_dating" boolean DEFAULT false,
    "chat_enabled" boolean DEFAULT true,
    "photos_enabled" boolean DEFAULT true,
    "status" "text" DEFAULT 'active'::"text",
    "cancelled_reason" "text",
    "moderation_status" "public"."moderation_status" DEFAULT 'approved'::"public"."moderation_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_attendees" (
    "activity_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'going'::"text",
    "rsvp_time" timestamp with time zone DEFAULT "now"(),
    "checked_in" boolean DEFAULT false,
    "checked_in_at" timestamp with time zone,
    "payment_status" "text",
    "payment_id" "text"
);


ALTER TABLE "public"."activity_attendees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid",
    "sender_id" "uuid",
    "content" "text",
    "message_type" "text" DEFAULT 'text'::"text",
    "media_urls" "text"[] DEFAULT '{}'::"text"[],
    "is_announcement" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ad_impressions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ad_id" "uuid",
    "user_id" "uuid",
    "location" "public"."geography"(Point,4326),
    "distance_meters" double precision,
    "clicked" boolean DEFAULT false,
    "claimed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ad_impressions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "description" "text",
    "enabled" boolean DEFAULT false,
    "provider" "text" DEFAULT 'openrouter'::"text",
    "model" "text" DEFAULT 'anthropic/claude-3.5-sonnet'::"text",
    "api_key_env" "text" DEFAULT 'OPENROUTER_API_KEY'::"text",
    "system_prompt" "text",
    "temperature" double precision DEFAULT 0.7,
    "max_tokens" integer DEFAULT 1000,
    "top_p" double precision DEFAULT 1.0,
    "fallback_enabled" boolean DEFAULT true,
    "fallback_behavior" "jsonb" DEFAULT '{"type": "rule_based"}'::"jsonb",
    "rate_limit_per_minute" integer DEFAULT 100,
    "rate_limit_per_day" integer DEFAULT 10000,
    "cost_tracking" boolean DEFAULT true,
    "max_cost_per_day" numeric(10,2) DEFAULT 100.00,
    "current_cost_today" numeric(10,6) DEFAULT 0,
    "cost_reset_at" timestamp with time zone DEFAULT "now"(),
    "log_all_requests" boolean DEFAULT true,
    "log_retention_days" integer DEFAULT 30,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_decisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "feature" "text" NOT NULL,
    "input_data" "jsonb",
    "context" "jsonb",
    "output_data" "jsonb",
    "decision" "text",
    "confidence" double precision,
    "reasoning" "text",
    "model_used" "text",
    "provider" "text",
    "tokens_input" integer,
    "tokens_output" integer,
    "latency_ms" integer,
    "cost" numeric(10,6),
    "was_overridden" boolean DEFAULT false,
    "override_by" "uuid",
    "override_reason" "text",
    "override_at" timestamp with time zone,
    "related_id" "uuid",
    "related_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ai_decisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "actor_type" "text" DEFAULT 'user'::"text",
    "ip_address" "inet",
    "user_agent" "text",
    "action" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "success" boolean DEFAULT true,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "trigger_event" "text" NOT NULL,
    "trigger_conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "actions" "jsonb" NOT NULL,
    "use_ai" boolean DEFAULT false,
    "ai_config_feature" "text",
    "is_active" boolean DEFAULT true,
    "priority" integer DEFAULT 0,
    "cooldown_seconds" integer DEFAULT 0,
    "times_triggered" integer DEFAULT 0,
    "last_triggered" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."automation_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blocks" (
    "blocker_id" "uuid" NOT NULL,
    "blocked_id" "uuid" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "user_id" "uuid",
    "service_name" "text",
    "booking_date" "date" NOT NULL,
    "booking_time" time without time zone NOT NULL,
    "duration_minutes" integer,
    "party_size" integer DEFAULT 1,
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "stripe_payment_intent_id" "text",
    "amount" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "confirmed_at" timestamp with time zone,
    "cancelled_at" timestamp with time zone,
    "cancel_reason" "text"
);


ALTER TABLE "public"."business_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."business_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "user_id" "uuid",
    "rating" integer NOT NULL,
    "title" "text",
    "content" "text",
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "visit_type" "text",
    "visit_date" "date",
    "helpful_count" integer DEFAULT 0,
    "is_verified_purchase" boolean DEFAULT false,
    "owner_response" "text",
    "owner_responded_at" timestamp with time zone,
    "moderation_status" "public"."moderation_status" DEFAULT 'pending'::"public"."moderation_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "business_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."business_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."businesses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_id" "uuid",
    "name" "text" NOT NULL,
    "slug" "text",
    "description" "text",
    "short_description" "text",
    "logo_url" "text",
    "cover_url" "text",
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "brand_color" "text",
    "category" "text" NOT NULL,
    "subcategory" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "location" "public"."geography"(Point,4326),
    "address" "jsonb",
    "address_formatted" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "social_links" "jsonb" DEFAULT '{}'::"jsonb",
    "hours" "jsonb" DEFAULT '{}'::"jsonb",
    "timezone" "text" DEFAULT 'UTC'::"text",
    "is_open_now" boolean DEFAULT false,
    "amenities" "text"[] DEFAULT '{}'::"text"[],
    "payment_methods" "text"[] DEFAULT '{}'::"text"[],
    "is_verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "verification_docs" "jsonb",
    "is_premium" boolean DEFAULT false,
    "subscription_tier" "text" DEFAULT 'free'::"text",
    "subscription_expires_at" timestamp with time zone,
    "stripe_account_id" "text",
    "stripe_onboarding_complete" boolean DEFAULT false,
    "can_book" boolean DEFAULT false,
    "can_order" boolean DEFAULT false,
    "can_reserve" boolean DEFAULT false,
    "delivery_enabled" boolean DEFAULT false,
    "proximity_ads_enabled" boolean DEFAULT false,
    "ad_budget_monthly" numeric(10,2) DEFAULT 0,
    "rating_avg" double precision DEFAULT 0,
    "rating_count" integer DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "follower_count" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."businesses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."city_challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenger_city_name" "text",
    "defender_city_name" "text",
    "challenge_type" "text" NOT NULL,
    "challenge_title" "text" NOT NULL,
    "description" "text",
    "start_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_time" timestamp with time zone,
    "target_user_count" integer DEFAULT 100,
    "current_participants" integer DEFAULT 0,
    "xp_reward" integer DEFAULT 0,
    "completion_percentage" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "rewards" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "ck_challenge_type" CHECK (("challenge_type" = ANY (ARRAY['fill_this_bar'::"text", 'create_group_strangers'::"text", 'turn_area_alive'::"text", 'meet_outside_type'::"text", 'sponsor_moment_drop'::"text", 'host_anonymous_night'::"text"]))),
    CONSTRAINT "ck_completion" CHECK ((("completion_percentage" >= 0) AND ("completion_percentage" <= 100)))
);


ALTER TABLE "public"."city_challenges" OWNER TO "postgres";


COMMENT ON TABLE "public"."city_challenges" IS 'City vs city competitions for engagement';



CREATE TABLE IF NOT EXISTS "public"."city_energy_states" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "city_name" "text" NOT NULL,
    "neighborhood" "text",
    "energy_level" "text" NOT NULL,
    "energy_score" integer NOT NULL,
    "user_count" integer DEFAULT 0,
    "activity_count" integer DEFAULT 0,
    "last_updated_at" timestamp with time zone DEFAULT "now"(),
    "location_bounds" "text",
    "is_active" boolean DEFAULT true,
    CONSTRAINT "ck_energy_level" CHECK (("energy_level" = ANY (ARRAY['party'::"text", 'calm'::"text", 'creative'::"text", 'dead'::"text", 'chaos'::"text", 'romantic'::"text", 'competitive'::"text"]))),
    CONSTRAINT "ck_energy_score" CHECK ((("energy_score" >= 0) AND ("energy_score" <= 100)))
);


ALTER TABLE "public"."city_energy_states" OWNER TO "postgres";


COMMENT ON TABLE "public"."city_energy_states" IS 'Live energy scores for cities and neighborhoods';



CREATE TABLE IF NOT EXISTS "public"."compliance_regions" (
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "regulations" "text"[] DEFAULT '{}'::"text"[],
    "age_of_consent" integer DEFAULT 18,
    "age_of_majority" integer DEFAULT 18,
    "requires_parental_consent_under" integer,
    "data_retention_days" integer,
    "data_export_deadline_days" integer DEFAULT 30,
    "data_deletion_deadline_days" integer DEFAULT 30,
    "special_categories" "text"[] DEFAULT '{}'::"text"[],
    "required_disclosures" "text"[] DEFAULT '{}'::"text"[],
    "banned_features" "text"[] DEFAULT '{}'::"text"[],
    "terms_version" "text",
    "privacy_version" "text",
    "cookie_policy_version" "text",
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."compliance_regions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid",
    "content_type" "public"."content_type" NOT NULL,
    "media_urls" "text"[] DEFAULT '{}'::"text"[],
    "thumbnail_url" "text",
    "text_content" "text",
    "location" "public"."geography"(Point,4326),
    "location_name" "text",
    "is_local" boolean DEFAULT true,
    "visibility" "text" DEFAULT 'public'::"text",
    "audience" "text"[] DEFAULT '{}'::"text"[],
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "shares_count" integer DEFAULT 0,
    "views_count" integer DEFAULT 0,
    "saves_count" integer DEFAULT 0,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "mentions" "uuid"[] DEFAULT '{}'::"uuid"[],
    "hashtags" "text"[] DEFAULT '{}'::"text"[],
    "comments_enabled" boolean DEFAULT true,
    "duet_enabled" boolean DEFAULT true,
    "download_enabled" boolean DEFAULT false,
    "moderation_status" "public"."moderation_status" DEFAULT 'pending'::"public"."moderation_status",
    "moderation_result" "jsonb",
    "moderated_at" timestamp with time zone,
    "moderated_by" "text",
    "is_pinned" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page" "text" NOT NULL,
    "block_key" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "locale" "text" DEFAULT 'en'::"text",
    "version" integer DEFAULT 1,
    "published" boolean DEFAULT true,
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text"[],
    "og_image" "text",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid",
    "user_id" "uuid",
    "parent_id" "uuid",
    "text" "text" NOT NULL,
    "likes_count" integer DEFAULT 0,
    "is_pinned" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_likes" (
    "content_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_saves" (
    "content_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "collection" "text" DEFAULT 'default'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_saves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_id" "uuid",
    "user_id" "uuid",
    "watch_duration_seconds" integer,
    "completed" boolean DEFAULT false,
    "source" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."content_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid",
    "user2_id" "uuid",
    "last_message_id" "uuid",
    "last_message_at" timestamp with time zone,
    "user1_unread_count" integer DEFAULT 0,
    "user2_unread_count" integer DEFAULT 0,
    "user1_archived" boolean DEFAULT false,
    "user2_archived" boolean DEFAULT false,
    "user1_muted" boolean DEFAULT false,
    "user2_muted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."crossed_paths" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid",
    "user2_id" "uuid",
    "location" "public"."geography"(Point,4326),
    "location_name" "text",
    "crossed_at" timestamp with time zone DEFAULT "now"(),
    "times_crossed" integer DEFAULT 1
);


ALTER TABLE "public"."crossed_paths" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."custom_themes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text" NOT NULL,
    "is_public" boolean DEFAULT false,
    "primary_color" "text" NOT NULL,
    "secondary_color" "text" NOT NULL,
    "accent_color" "text" NOT NULL,
    "background_color" "text" NOT NULL,
    "text_color" "text" NOT NULL,
    "border_radius" "text" DEFAULT 'medium'::"text",
    "shadow_intensity" "text" DEFAULT 'medium'::"text",
    "downloads" integer DEFAULT 0,
    "likes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."custom_themes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "request_type" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "scope" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "requested_at" timestamp with time zone DEFAULT "now"(),
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "deadline" timestamp with time zone,
    "download_url" "text",
    "download_expires_at" timestamp with time zone,
    "processed_by" "uuid",
    "processing_notes" "text",
    CONSTRAINT "data_requests_request_type_check" CHECK (("request_type" = ANY (ARRAY['export'::"text", 'delete'::"text", 'rectify'::"text", 'restrict'::"text"])))
);


ALTER TABLE "public"."data_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dating_matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid",
    "user2_id" "uuid",
    "matched_at" timestamp with time zone DEFAULT "now"(),
    "context" "text" DEFAULT 'proximity'::"text",
    "context_id" "uuid",
    "is_anonymous" boolean DEFAULT false,
    "user1_revealed" boolean DEFAULT false,
    "user2_revealed" boolean DEFAULT false,
    "chat_started" boolean DEFAULT false,
    "first_message_at" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text",
    "unmatched_by" "uuid",
    "unmatched_at" timestamp with time zone,
    CONSTRAINT "different_users" CHECK (("user1_id" <> "user2_id"))
);


ALTER TABLE "public"."dating_matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dating_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "match_id" "uuid",
    "sender_id" "uuid",
    "content" "text",
    "message_type" "text" DEFAULT 'text'::"text",
    "media_url" "text",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dating_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dating_profiles" (
    "user_id" "uuid" NOT NULL,
    "is_active" boolean DEFAULT false,
    "modes_enabled" "text"[] DEFAULT '{proximity}'::"text"[],
    "age_min" integer DEFAULT 18,
    "age_max" integer DEFAULT 99,
    "gender_preference" "text"[] DEFAULT '{}'::"text"[],
    "distance_max_km" integer DEFAULT 50,
    "show_photos" boolean DEFAULT true,
    "show_last_name" boolean DEFAULT false,
    "show_age" boolean DEFAULT true,
    "show_distance" boolean DEFAULT true,
    "prompts" "jsonb" DEFAULT '[]'::"jsonb",
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "interests" "text"[] DEFAULT '{}'::"text"[],
    "looking_for" "text"[] DEFAULT '{}'::"text"[],
    "deal_breakers" "text"[] DEFAULT '{}'::"text"[],
    "height_cm" integer,
    "height_preference_min" integer,
    "height_preference_max" integer,
    "relationship_type" "text",
    "daily_swipe_count" integer DEFAULT 0,
    "daily_swipe_reset" timestamp with time zone,
    "last_active" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dating_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dating_swipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "swiper_id" "uuid",
    "swiped_id" "uuid",
    "direction" "text" NOT NULL,
    "context" "text" DEFAULT 'proximity'::"text",
    "context_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "dating_swipes_direction_check" CHECK (("direction" = ANY (ARRAY['left'::"text", 'right'::"text", 'super'::"text"])))
);


ALTER TABLE "public"."dating_swipes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."digital_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "asset_type" "text" NOT NULL,
    "category" "text",
    "price" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "stripe_price_id" "text",
    "asset_data" "jsonb" NOT NULL,
    "preview_url" "text",
    "is_limited" boolean DEFAULT false,
    "quantity_available" integer,
    "quantity_sold" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "location" "public"."geography"(Point,4326)
);


ALTER TABLE "public"."digital_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."direct_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid",
    "recipient_id" "uuid",
    "content" "text",
    "message_type" "text" DEFAULT 'text'::"text",
    "media_urls" "text"[] DEFAULT '{}'::"text"[],
    "reply_to" "uuid",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "is_deleted_sender" boolean DEFAULT false,
    "is_deleted_recipient" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."direct_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_templates" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "html_content" "text" NOT NULL,
    "text_content" "text",
    "variables" "text"[] DEFAULT '{}'::"text"[],
    "category" "text",
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "name" "text" NOT NULL,
    "enabled" boolean DEFAULT false,
    "rollout_percentage" integer DEFAULT 100,
    "user_whitelist" "uuid"[] DEFAULT '{}'::"uuid"[],
    "user_blacklist" "uuid"[] DEFAULT '{}'::"uuid"[],
    "countries" "text"[] DEFAULT '{}'::"text"[],
    "subscription_tiers" "text"[] DEFAULT '{}'::"text"[],
    "description" "text",
    "category" "text",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "feature_flags_rollout_percentage_check" CHECK ((("rollout_percentage" >= 0) AND ("rollout_percentage" <= 100)))
);


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "notifications_enabled" boolean DEFAULT true,
    CONSTRAINT "no_self_follow" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "inviter_id" "uuid",
    "invitee_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "responded_at" timestamp with time zone
);


ALTER TABLE "public"."group_invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "nickname" "text",
    "notifications_enabled" boolean DEFAULT true,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "invited_by" "uuid"
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "sender_id" "uuid",
    "content" "text",
    "message_type" "text" DEFAULT 'text'::"text",
    "media_urls" "text"[] DEFAULT '{}'::"text"[],
    "reply_to" "uuid",
    "reactions" "jsonb" DEFAULT '{}'::"jsonb",
    "is_pinned" boolean DEFAULT false,
    "is_deleted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "edited_at" timestamp with time zone
);


ALTER TABLE "public"."group_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "avatar_url" "text",
    "cover_url" "text",
    "creator_id" "uuid",
    "location" "public"."geography"(Point,4326),
    "location_name" "text",
    "is_moving" boolean DEFAULT false,
    "is_public" boolean DEFAULT true,
    "is_verified" boolean DEFAULT false,
    "join_approval_required" boolean DEFAULT false,
    "invite_only" boolean DEFAULT false,
    "member_count" integer DEFAULT 0,
    "max_members" integer DEFAULT 100,
    "chat_enabled" boolean DEFAULT true,
    "dating_enabled" boolean DEFAULT false,
    "activities_enabled" boolean DEFAULT true,
    "content_enabled" boolean DEFAULT true,
    "vibe_tags" "text"[] DEFAULT '{}'::"text"[],
    "category" "text",
    "interests" "text"[] DEFAULT '{}'::"text"[],
    "moderation_level" "text" DEFAULT 'standard'::"text",
    "banned_words" "text"[] DEFAULT '{}'::"text"[],
    "last_activity" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "banner_url" "text",
    "privacy" "text" DEFAULT 'public'::"text",
    "location_lat" double precision,
    "location_lng" double precision,
    CONSTRAINT "groups_privacy_check" CHECK (("privacy" = ANY (ARRAY['public'::"text", 'private'::"text", 'secret'::"text"])))
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hashtag_stats" (
    "hashtag" "text" NOT NULL,
    "usage_count" integer DEFAULT 0,
    "trend_score" double precision DEFAULT 0,
    "last_used" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hashtag_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaderboard_entries" (
    "leaderboard_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "score" integer DEFAULT 0,
    "rank" integer,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."leaderboard_entries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leaderboards" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "metric" "text" NOT NULL,
    "period" "text" DEFAULT 'weekly'::"text",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."leaderboards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."live_streams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "host_id" "uuid",
    "title" "text",
    "description" "text",
    "thumbnail_url" "text",
    "stream_type" "text" NOT NULL,
    "location" "public"."geography"(Point,4326),
    "location_name" "text",
    "webrtc_room_id" "text",
    "stream_key" "text",
    "playback_url" "text",
    "is_active" boolean DEFAULT true,
    "is_anonymous" boolean DEFAULT false,
    "visibility" "text" DEFAULT 'public'::"text",
    "allow_comments" boolean DEFAULT true,
    "allow_gifts" boolean DEFAULT true,
    "max_viewers" integer DEFAULT 1000,
    "max_duration_seconds" integer DEFAULT 3600,
    "viewer_count" integer DEFAULT 0,
    "peak_viewers" integer DEFAULT 0,
    "total_views" integer DEFAULT 0,
    "likes_count" integer DEFAULT 0,
    "gifts_received" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "scheduled_for" timestamp with time zone,
    "recording_enabled" boolean DEFAULT false,
    "recording_url" "text",
    "is_public" boolean DEFAULT true,
    "max_participants" integer DEFAULT 50,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "is_live" boolean GENERATED ALWAYS AS ("is_active") STORED,
    CONSTRAINT "live_streams_stream_type_check" CHECK (("stream_type" = ANY (ARRAY['place'::"text", 'solo'::"text", 'random_connect'::"text", 'group'::"text", 'activity'::"text"])))
);


ALTER TABLE "public"."live_streams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."location_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "location" "public"."geography"(Point,4326),
    "recorded_at" timestamp with time zone DEFAULT "now"(),
    "accuracy" double precision,
    "source" "text" DEFAULT 'gps'::"text"
);


ALTER TABLE "public"."location_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."loneliness_detection" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "detected_at" timestamp with time zone DEFAULT "now"(),
    "isolation_score" integer DEFAULT 0,
    "last_active_at" timestamp with time zone,
    "consecutive_inactive_periods" integer DEFAULT 0,
    "intervention_triggered" boolean DEFAULT false,
    "intervention_type" "text",
    "intervention_sent_at" timestamp with time zone,
    CONSTRAINT "ck_isolation_score" CHECK ((("isolation_score" >= 0) AND ("isolation_score" <= 100)))
);


ALTER TABLE "public"."loneliness_detection" OWNER TO "postgres";


COMMENT ON TABLE "public"."loneliness_detection" IS 'Detects isolation patterns and triggers interventions';



CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid",
    "user2_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."memory_capsules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "capsule_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "jsonb" NOT NULL,
    "location_lat" numeric(10,8),
    "location_lng" numeric(10,8),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "shared_with" "uuid"[] DEFAULT '{}'::"uuid"[],
    "is_private" boolean DEFAULT false,
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "mood_score" integer DEFAULT 0,
    "energy_score" integer DEFAULT 0
);


ALTER TABLE "public"."memory_capsules" OWNER TO "postgres";


COMMENT ON TABLE "public"."memory_capsules" IS 'Stores personal life archives - places visited, people met, groups joined, moments shared';



CREATE TABLE IF NOT EXISTS "public"."moment_drops" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "drop_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "location_lat" numeric(10,8),
    "location_lng" numeric(10,8),
    "radius_meters" integer DEFAULT 500,
    "start_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "max_participants" integer DEFAULT 1000,
    "current_participants" integer DEFAULT 0,
    "rewards" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_by_user_id" "uuid",
    CONSTRAINT "ck_drop_type" CHECK (("drop_type" = ANY (ARRAY['flash_drinks'::"text", 'hidden_dj'::"text", 'mystery_group'::"text", 'rare_asset'::"text", 'confession_zone'::"text", 'dating_boost'::"text", 'anonymous_confession'::"text"])))
);


ALTER TABLE "public"."moment_drops" OWNER TO "postgres";


COMMENT ON TABLE "public"."moment_drops" IS 'Viral time-limited events that create mass convergence';



CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "user_id" "uuid" NOT NULL,
    "push_enabled" boolean DEFAULT true,
    "email_enabled" boolean DEFAULT true,
    "sms_enabled" boolean DEFAULT false,
    "matches_push" boolean DEFAULT true,
    "matches_email" boolean DEFAULT true,
    "messages_push" boolean DEFAULT true,
    "messages_email" boolean DEFAULT false,
    "activities_push" boolean DEFAULT true,
    "activities_email" boolean DEFAULT true,
    "groups_push" boolean DEFAULT true,
    "groups_email" boolean DEFAULT false,
    "content_push" boolean DEFAULT true,
    "content_email" boolean DEFAULT false,
    "marketing_push" boolean DEFAULT false,
    "marketing_email" boolean DEFAULT false,
    "quiet_hours_enabled" boolean DEFAULT false,
    "quiet_hours_start" time without time zone,
    "quiet_hours_end" time without time zone,
    "quiet_hours_timezone" "text" DEFAULT 'UTC'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "notification_type" "text" NOT NULL,
    "category" "text",
    "title" "text" NOT NULL,
    "body" "text",
    "image_url" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "action_url" "text",
    "action_type" "text",
    "related_id" "uuid",
    "related_type" "text",
    "sender_id" "uuid",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "is_pushed" boolean DEFAULT false,
    "pushed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."panic_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "triggered_at" timestamp with time zone DEFAULT "now"(),
    "location" "public"."geography"(Point,4326),
    "context" "jsonb",
    "resolved_at" timestamp with time zone,
    "resolution" "text"
);


ALTER TABLE "public"."panic_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "payment_type" "text" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "stripe_payment_intent_id" "text",
    "stripe_invoice_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."platform_config" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "value_type" "text" DEFAULT 'json'::"text",
    "category" "text" NOT NULL,
    "subcategory" "text",
    "display_name" "text",
    "description" "text",
    "is_secret" boolean DEFAULT false,
    "is_env_var" boolean DEFAULT false,
    "env_var_name" "text",
    "can_edit_live" boolean DEFAULT true,
    "requires_restart" boolean DEFAULT false,
    "validation_schema" "jsonb",
    "updated_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "previous_value" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."platform_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "username" "text",
    "display_name" "text",
    "email" "text",
    "phone" "text",
    "avatar_url" "text",
    "avatar_3d_config" "jsonb" DEFAULT '{}'::"jsonb",
    "cover_url" "text",
    "bio" "text",
    "interests" "text"[] DEFAULT '{}'::"text"[],
    "vibe_tags" "text"[] DEFAULT '{}'::"text"[],
    "date_of_birth" "date",
    "gender" "text",
    "location_city" "text",
    "location_country" "text",
    "location_timezone" "text",
    "is_creator" boolean DEFAULT false,
    "creator_handle" "text",
    "creator_bio" "text",
    "creator_categories" "text"[] DEFAULT '{}'::"text"[],
    "creator_verified" boolean DEFAULT false,
    "creator_monetization_enabled" boolean DEFAULT false,
    "follower_count" integer DEFAULT 0,
    "following_count" integer DEFAULT 0,
    "subscription_tier" "public"."subscription_tier" DEFAULT 'free'::"public"."subscription_tier",
    "subscription_expires_at" timestamp with time zone,
    "stripe_customer_id" "text",
    "badges" "text"[] DEFAULT '{}'::"text"[],
    "achievements" "jsonb" DEFAULT '{}'::"jsonb",
    "digital_assets" "jsonb" DEFAULT '{}'::"jsonb",
    "xp_points" integer DEFAULT 0,
    "level" integer DEFAULT 1,
    "privacy_settings" "jsonb" DEFAULT '{"show_age": false, "allow_follows": true, "show_distance": true, "profile_visible": true, "location_visible": true, "allow_messages_from": "everyone", "online_status_visible": true}'::"jsonb",
    "dating_enabled" boolean DEFAULT false,
    "dating_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "verified" boolean DEFAULT false,
    "banned" boolean DEFAULT false,
    "ban_reason" "text",
    "banned_until" timestamp with time zone,
    "last_active" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "stripe_connect_id" "text",
    "api_token" "text",
    "full_name" "text",
    "website" "text",
    "first_name" "text",
    "last_name" "text",
    "birth_date" "date",
    "last_known_location" "public"."geography"(Point,4326),
    "stripe_subscription_id" "text",
    "subscription_status" "text" DEFAULT 'inactive'::"text",
    "subscription_start" timestamp with time zone,
    "subscription_end" timestamp with time zone
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."profiles" AS
 SELECT "id",
    "username",
    "display_name",
    "email",
    "phone",
    "avatar_url",
    "avatar_3d_config",
    "cover_url",
    "bio",
    "interests",
    "vibe_tags",
    "date_of_birth",
    "gender",
    "location_city",
    "location_country",
    "location_timezone",
    "is_creator",
    "creator_handle",
    "creator_bio",
    "creator_categories",
    "creator_verified",
    "creator_monetization_enabled",
    "follower_count",
    "following_count",
    "subscription_tier",
    "subscription_expires_at",
    "stripe_customer_id",
    "badges",
    "achievements",
    "digital_assets",
    "xp_points",
    "level",
    "privacy_settings",
    "dating_enabled",
    "dating_preferences",
    "verified",
    "banned",
    "ban_reason",
    "banned_until",
    "last_active",
    "created_at",
    "updated_at",
    "stripe_connect_id",
    "api_token",
    "full_name",
    "website",
    "first_name",
    "last_name",
    "birth_date"
   FROM "public"."user_profiles";


ALTER VIEW "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proximity_ads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "business_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "cta_text" "text" DEFAULT 'Learn More'::"text",
    "cta_url" "text",
    "offer_type" "text",
    "discount_amount" numeric(10,2),
    "discount_type" "text",
    "promo_code" "text",
    "radius_meters" integer DEFAULT 500,
    "target_age_min" integer,
    "target_age_max" integer,
    "target_genders" "text"[],
    "target_interests" "text"[],
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "active_hours" "jsonb",
    "max_impressions" integer,
    "max_claims" integer,
    "daily_budget" numeric(10,2),
    "cost_per_impression" numeric(10,4) DEFAULT 0.01,
    "cost_per_click" numeric(10,4) DEFAULT 0.10,
    "cost_per_claim" numeric(10,4) DEFAULT 1.00,
    "impressions_count" integer DEFAULT 0,
    "clicks_count" integer DEFAULT 0,
    "claims_count" integer DEFAULT 0,
    "total_spent" numeric(10,2) DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "is_approved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."proximity_ads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."push_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "token" "text" NOT NULL,
    "platform" "text" NOT NULL,
    "device_id" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_used" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."random_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_id" "uuid",
    "sender_id" "uuid",
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."random_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."random_chat_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "location" "public"."geography"(Point,4326),
    "gender" "text",
    "gender_preference" "text",
    "intent" "text",
    "anonymous" boolean DEFAULT true,
    "nearby_only" boolean DEFAULT true,
    "search_radius_km" integer DEFAULT 25,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:03:00'::interval)
);


ALTER TABLE "public"."random_chat_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."random_chats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid",
    "user2_id" "uuid",
    "is_anonymous" boolean DEFAULT true,
    "distance_km" double precision,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "duration_seconds" integer,
    "message_count" integer DEFAULT 0,
    "converted_to" "text",
    "ended_by" "uuid",
    "end_reason" "text"
);


ALTER TABLE "public"."random_chats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."random_connect_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "connection_type" "text" NOT NULL,
    "location" "public"."geography"(Point,4326),
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "nearby_only" boolean DEFAULT true,
    "search_radius_km" integer DEFAULT 50,
    "global_fallback" boolean DEFAULT true,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:02:00'::interval)
);


ALTER TABLE "public"."random_connect_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."random_connections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid",
    "user2_id" "uuid",
    "connection_type" "text" NOT NULL,
    "user1_location" "public"."geography"(Point,4326),
    "user2_location" "public"."geography"(Point,4326),
    "distance_km" double precision,
    "is_nearby" boolean DEFAULT true,
    "webrtc_room_id" "text",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "duration_seconds" integer,
    "ended_by" "uuid",
    "end_reason" "text",
    "converted_to" "text",
    "user1_rating" integer,
    "user2_rating" integer,
    "reported" boolean DEFAULT false,
    "report_reason" "text",
    CONSTRAINT "random_connections_connection_type_check" CHECK (("connection_type" = ANY (ARRAY['video'::"text", 'audio'::"text", 'chat'::"text"]))),
    CONSTRAINT "random_connections_user1_rating_check" CHECK ((("user1_rating" >= 1) AND ("user1_rating" <= 5))),
    CONSTRAINT "random_connections_user2_rating_check" CHECK ((("user2_rating" >= 1) AND ("user2_rating" <= 5)))
);


ALTER TABLE "public"."random_connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."random_date_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "location" "public"."geography"(Point,4326),
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "search_radius_km" integer DEFAULT 10,
    "nearby_only" boolean DEFAULT true,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:05:00'::interval)
);


ALTER TABLE "public"."random_date_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid",
    "reported_user_id" "uuid",
    "reported_content_id" "uuid",
    "reported_content_type" "text",
    "reason" "text" NOT NULL,
    "description" "text",
    "evidence_urls" "text"[] DEFAULT '{}'::"text"[],
    "status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'normal'::"text",
    "ai_severity_score" double precision,
    "ai_analysis" "jsonb",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "resolution" "text",
    "action_taken" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."social_signals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "signal_type" "text" NOT NULL,
    "signal_value" "text",
    "start_time" timestamp with time zone DEFAULT "now"(),
    "end_time" timestamp with time zone NOT NULL,
    "duration_minutes" integer DEFAULT 30,
    "visibility_radius_meters" integer DEFAULT 1000,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "ck_signal_type" CHECK (("signal_type" = ANY (ARRAY['open_to_talk'::"text", 'dont_approach'::"text", 'looking_for_chaos'::"text", 'looking_for_calm'::"text", 'open_to_dating'::"text", 'just_watching'::"text", 'party_mode'::"text", 'needs_company'::"text", 'panic_mode'::"text"])))
);


ALTER TABLE "public"."social_signals" OWNER TO "postgres";


COMMENT ON TABLE "public"."social_signals" IS 'Real-time status signals shown on user avatars';



CREATE TABLE IF NOT EXISTS "public"."stream_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stream_id" "uuid",
    "user_id" "uuid",
    "content" "text",
    "message_type" "text" DEFAULT 'chat'::"text",
    "gift_type" "text",
    "gift_amount" numeric(10,2),
    "is_pinned" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stream_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stream_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stream_id" "uuid",
    "user_id" "uuid",
    "role" "text" DEFAULT 'viewer'::"text",
    "joined_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "left_at" timestamp with time zone,
    CONSTRAINT "stream_participants_role_check" CHECK (("role" = ANY (ARRAY['host'::"text", 'moderator'::"text", 'viewer'::"text"])))
);


ALTER TABLE "public"."stream_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stream_viewers" (
    "stream_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "left_at" timestamp with time zone,
    "watch_duration_seconds" integer DEFAULT 0
);


ALTER TABLE "public"."stream_viewers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stripe_connect_accounts" (
    "user_id" "uuid" NOT NULL,
    "stripe_account_id" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "details_submitted" boolean DEFAULT false,
    "payouts_enabled" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "stripe_connect_accounts_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'restricted'::"text"])))
);


ALTER TABLE "public"."stripe_connect_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "stripe_event_id" "text",
    "subscription_tier" "text",
    "amount" integer,
    "currency" "text" DEFAULT 'usd'::"text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "tier" "public"."subscription_tier" NOT NULL,
    "description" "text",
    "price_monthly" numeric(10,2) NOT NULL,
    "price_yearly" numeric(10,2),
    "currency" "text" DEFAULT 'USD'::"text",
    "stripe_price_monthly" "text",
    "stripe_price_yearly" "text",
    "features" "jsonb" DEFAULT '{}'::"jsonb",
    "limits" "jsonb" DEFAULT '{}'::"jsonb",
    "is_popular" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "wallet_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" DEFAULT 'completed'::"text",
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "user_id" "uuid" NOT NULL,
    "achievement_id" "text" NOT NULL,
    "progress" integer DEFAULT 0,
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "claimed" boolean DEFAULT false,
    "claimed_at" timestamp with time zone
);


ALTER TABLE "public"."user_achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "asset_id" "uuid",
    "acquired_at" timestamp with time zone DEFAULT "now"(),
    "acquisition_type" "text" DEFAULT 'purchase'::"text",
    "payment_id" "uuid",
    "is_equipped" boolean DEFAULT false,
    "equipped_slot" "text"
);


ALTER TABLE "public"."user_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_consents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "consent_type" "text" NOT NULL,
    "consent_version" "text" NOT NULL,
    "granted" boolean NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "withdrawn_at" timestamp with time zone
);


ALTER TABLE "public"."user_consents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_identity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "pronouns" "text"[],
    "gender_identity" "text",
    "sexual_orientation" "text",
    "relationship_status" "text",
    "ethnicity" "text"[],
    "cultural_background" "text"[],
    "languages_spoken" "text"[],
    "religion" "text",
    "political_views" "text",
    "dietary_preferences" "text"[],
    "disabilities" "text"[],
    "neurodivergent_status" "text",
    "interests" "jsonb" DEFAULT '[]'::"jsonb",
    "hobbies" "jsonb" DEFAULT '[]'::"jsonb",
    "pronouns_visible" boolean DEFAULT true,
    "gender_visible" boolean DEFAULT true,
    "orientation_visible" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_identity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_metrics" (
    "user_id" "uuid" NOT NULL,
    "followers_count" integer DEFAULT 0,
    "following_count" integer DEFAULT 0,
    "posts_count" integer DEFAULT 0,
    "hup_score" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "theme_mode" "text" DEFAULT 'dark'::"text",
    "theme_color" "text" DEFAULT 'electric'::"text",
    "custom_primary_color" "text",
    "custom_secondary_color" "text",
    "custom_accent_color" "text",
    "font_family" "text" DEFAULT 'outfit'::"text",
    "font_size" "text" DEFAULT 'medium'::"text",
    "layout_style" "text" DEFAULT 'modern'::"text",
    "sidebar_position" "text" DEFAULT 'left'::"text",
    "show_animations" boolean DEFAULT true,
    "reduce_motion" boolean DEFAULT false,
    "profile_visibility" "text" DEFAULT 'public'::"text",
    "location_sharing" "text" DEFAULT 'precise'::"text",
    "online_status_visible" boolean DEFAULT true,
    "read_receipts_enabled" boolean DEFAULT true,
    "typing_indicators_enabled" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "email_notifications" boolean DEFAULT true,
    "sms_notifications" boolean DEFAULT false,
    "notification_sound" "text" DEFAULT 'default'::"text",
    "vibration_enabled" boolean DEFAULT true,
    "quiet_hours_start" time without time zone,
    "quiet_hours_end" time without time zone,
    "content_language" "text" DEFAULT 'en'::"text",
    "auto_translate" boolean DEFAULT false,
    "show_sensitive_content" boolean DEFAULT false,
    "content_filter_level" "text" DEFAULT 'medium'::"text",
    "high_contrast" boolean DEFAULT false,
    "screen_reader_optimized" boolean DEFAULT false,
    "keyboard_navigation" boolean DEFAULT false,
    "captions_enabled" boolean DEFAULT false,
    "ai_recommendations" boolean DEFAULT true,
    "data_saver_mode" boolean DEFAULT false,
    "offline_mode" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_presence" (
    "user_id" "uuid" NOT NULL,
    "location" "public"."geography"(Point,4326),
    "location_name" "text",
    "heading" double precision,
    "speed" double precision,
    "accuracy" double precision,
    "altitude" double precision,
    "is_visible" boolean DEFAULT true,
    "visibility_radius" integer DEFAULT 5000,
    "visibility_mode" "text" DEFAULT 'normal'::"text",
    "anonymous_mode" boolean DEFAULT false,
    "availability" "public"."user_availability" DEFAULT 'available'::"public"."user_availability",
    "status_text" "text",
    "status_emoji" "text",
    "intent_icons" "text"[] DEFAULT '{}'::"text"[],
    "mood" "text",
    "energy_level" integer,
    "looking_for" "text"[] DEFAULT '{}'::"text"[],
    "current_activity_id" "uuid",
    "current_group_id" "uuid",
    "last_location_update" timestamp with time zone DEFAULT "now"(),
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "presence_expires_at" timestamp with time zone,
    "last_known_location" "public"."geometry"(Point,4326),
    "last_location_updated_at" timestamp with time zone,
    "online_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    CONSTRAINT "user_presence_energy_level_check" CHECK ((("energy_level" >= 0) AND ("energy_level" <= 100))),
    CONSTRAINT "valid_visibility_radius" CHECK ((("visibility_radius" >= 0) AND ("visibility_radius" <= 50000)))
);


ALTER TABLE "public"."user_presence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'user'::"text",
    "organization_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'moderator'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "device_id" "text",
    "device_name" "text",
    "device_type" "text",
    "os" "text",
    "browser" "text",
    "ip_address" "inet",
    "location_country" "text",
    "location_city" "text",
    "is_active" boolean DEFAULT true,
    "last_active" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "revoked_at" timestamp with time zone,
    "revoke_reason" "text"
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_social_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "role_type" "text" NOT NULL,
    "earned_at" timestamp with time zone DEFAULT "now"(),
    "current_level" integer DEFAULT 1,
    "xp_points" integer DEFAULT 0,
    "unlocks" "jsonb" DEFAULT '{}'::"jsonb",
    "role_attributes" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    CONSTRAINT "ck_level" CHECK (("current_level" >= 1)),
    CONSTRAINT "ck_role_type" CHECK (("role_type" = ANY (ARRAY['connector'::"text", 'explorer'::"text", 'host'::"text", 'muse'::"text", 'catalyst'::"text", 'ghost'::"text", 'legend'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."user_social_roles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_social_roles" IS 'Behavior-based roles: Connector, Explorer, Host, Muse, Catalyst, Ghost, Legend';



CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "plan_id" "text",
    "status" "text" DEFAULT 'active'::"text",
    "stripe_subscription_id" "text",
    "stripe_customer_id" "text",
    "billing_period" "text" DEFAULT 'monthly'::"text",
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "trial_start" timestamp with time zone,
    "trial_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "cancelled_at" timestamp with time zone,
    "cancel_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "balance" numeric DEFAULT 0.00 NOT NULL,
    "currency" "text" DEFAULT 'HUP'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wallets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."withdrawals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'USD'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "stripe_transfer_id" "text",
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "withdrawals_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."withdrawals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."_managed_webhooks" (
    "id" "text" NOT NULL,
    "object" "text",
    "url" "text" NOT NULL,
    "enabled_events" "jsonb" NOT NULL,
    "description" "text",
    "enabled" boolean,
    "livemode" boolean,
    "metadata" "jsonb",
    "secret" "text" NOT NULL,
    "status" "text",
    "api_version" "text",
    "created" integer,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "last_synced_at" timestamp with time zone,
    "account_id" "text" NOT NULL
);


ALTER TABLE "stripe"."_managed_webhooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."_migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "stripe"."_migrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."_sync_obj_runs" (
    "_account_id" "text" NOT NULL,
    "run_started_at" timestamp with time zone NOT NULL,
    "object" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "processed_count" integer DEFAULT 0,
    "cursor" "text",
    "error_message" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "_sync_obj_run_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'running'::"text", 'complete'::"text", 'error'::"text"])))
);


ALTER TABLE "stripe"."_sync_obj_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."_sync_runs" (
    "_account_id" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "max_concurrent" integer DEFAULT 3 NOT NULL,
    "error_message" "text",
    "triggered_by" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "closed_at" timestamp with time zone
);


ALTER TABLE "stripe"."_sync_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."accounts" (
    "_raw_data" "jsonb" NOT NULL,
    "first_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "_last_synced_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "_updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "business_name" "text" GENERATED ALWAYS AS ((("_raw_data" -> 'business_profile'::"text") ->> 'name'::"text")) STORED,
    "email" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'email'::"text")) STORED,
    "type" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'type'::"text")) STORED,
    "charges_enabled" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'charges_enabled'::"text"))::boolean) STORED,
    "payouts_enabled" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'payouts_enabled'::"text"))::boolean) STORED,
    "details_submitted" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'details_submitted'::"text"))::boolean) STORED,
    "country" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'country'::"text")) STORED,
    "default_currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'default_currency'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "api_key_hashes" "text"[] DEFAULT '{}'::"text"[],
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."active_entitlements" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "feature" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'feature'::"text")) STORED,
    "customer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer'::"text")) STORED,
    "lookup_key" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'lookup_key'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."active_entitlements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."charges" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "paid" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'paid'::"text"))::boolean) STORED,
    "order" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'order'::"text")) STORED,
    "amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount'::"text"))::bigint) STORED,
    "review" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'review'::"text")) STORED,
    "source" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'source'::"text")) STORED,
    "status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'status'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "dispute" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'dispute'::"text")) STORED,
    "invoice" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'invoice'::"text")) STORED,
    "outcome" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'outcome'::"text")) STORED,
    "refunds" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'refunds'::"text")) STORED,
    "updated" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'updated'::"text"))::integer) STORED,
    "captured" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'captured'::"text"))::boolean) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "customer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "refunded" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'refunded'::"text"))::boolean) STORED,
    "shipping" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'shipping'::"text")) STORED,
    "application" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'application'::"text")) STORED,
    "description" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'description'::"text")) STORED,
    "destination" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'destination'::"text")) STORED,
    "failure_code" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'failure_code'::"text")) STORED,
    "on_behalf_of" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'on_behalf_of'::"text")) STORED,
    "fraud_details" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'fraud_details'::"text")) STORED,
    "receipt_email" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'receipt_email'::"text")) STORED,
    "payment_intent" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_intent'::"text")) STORED,
    "receipt_number" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'receipt_number'::"text")) STORED,
    "transfer_group" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'transfer_group'::"text")) STORED,
    "amount_refunded" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_refunded'::"text"))::bigint) STORED,
    "application_fee" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'application_fee'::"text")) STORED,
    "failure_message" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'failure_message'::"text")) STORED,
    "source_transfer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'source_transfer'::"text")) STORED,
    "balance_transaction" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'balance_transaction'::"text")) STORED,
    "statement_descriptor" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'statement_descriptor'::"text")) STORED,
    "payment_method_details" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'payment_method_details'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."charges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."checkout_session_line_items" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "description" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'description'::"text")) STORED,
    "price" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'price'::"text")) STORED,
    "quantity" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'quantity'::"text"))::integer) STORED,
    "checkout_session" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'checkout_session'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL,
    "amount_discount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_discount'::"text"))::bigint) STORED,
    "amount_subtotal" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_subtotal'::"text"))::bigint) STORED,
    "amount_tax" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_tax'::"text"))::bigint) STORED,
    "amount_total" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_total'::"text"))::bigint) STORED
);


ALTER TABLE "stripe"."checkout_session_line_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."checkout_sessions" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "adaptive_pricing" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'adaptive_pricing'::"text")) STORED,
    "after_expiration" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'after_expiration'::"text")) STORED,
    "allow_promotion_codes" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'allow_promotion_codes'::"text"))::boolean) STORED,
    "automatic_tax" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'automatic_tax'::"text")) STORED,
    "billing_address_collection" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'billing_address_collection'::"text")) STORED,
    "cancel_url" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'cancel_url'::"text")) STORED,
    "client_reference_id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'client_reference_id'::"text")) STORED,
    "client_secret" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'client_secret'::"text")) STORED,
    "collected_information" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'collected_information'::"text")) STORED,
    "consent" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'consent'::"text")) STORED,
    "consent_collection" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'consent_collection'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "currency_conversion" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'currency_conversion'::"text")) STORED,
    "custom_fields" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'custom_fields'::"text")) STORED,
    "custom_text" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'custom_text'::"text")) STORED,
    "customer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer'::"text")) STORED,
    "customer_creation" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer_creation'::"text")) STORED,
    "customer_details" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'customer_details'::"text")) STORED,
    "customer_email" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer_email'::"text")) STORED,
    "discounts" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'discounts'::"text")) STORED,
    "expires_at" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'expires_at'::"text"))::integer) STORED,
    "invoice" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'invoice'::"text")) STORED,
    "invoice_creation" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'invoice_creation'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "locale" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'locale'::"text")) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "mode" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'mode'::"text")) STORED,
    "optional_items" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'optional_items'::"text")) STORED,
    "payment_intent" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_intent'::"text")) STORED,
    "payment_link" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_link'::"text")) STORED,
    "payment_method_collection" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_method_collection'::"text")) STORED,
    "payment_method_configuration_details" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'payment_method_configuration_details'::"text")) STORED,
    "payment_method_options" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'payment_method_options'::"text")) STORED,
    "payment_method_types" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'payment_method_types'::"text")) STORED,
    "payment_status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_status'::"text")) STORED,
    "permissions" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'permissions'::"text")) STORED,
    "phone_number_collection" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'phone_number_collection'::"text")) STORED,
    "presentment_details" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'presentment_details'::"text")) STORED,
    "recovered_from" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'recovered_from'::"text")) STORED,
    "redirect_on_completion" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'redirect_on_completion'::"text")) STORED,
    "return_url" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'return_url'::"text")) STORED,
    "saved_payment_method_options" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'saved_payment_method_options'::"text")) STORED,
    "setup_intent" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'setup_intent'::"text")) STORED,
    "shipping_address_collection" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'shipping_address_collection'::"text")) STORED,
    "shipping_cost" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'shipping_cost'::"text")) STORED,
    "shipping_details" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'shipping_details'::"text")) STORED,
    "shipping_options" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'shipping_options'::"text")) STORED,
    "status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'status'::"text")) STORED,
    "submit_type" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'submit_type'::"text")) STORED,
    "subscription" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'subscription'::"text")) STORED,
    "success_url" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'success_url'::"text")) STORED,
    "tax_id_collection" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'tax_id_collection'::"text")) STORED,
    "total_details" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'total_details'::"text")) STORED,
    "ui_mode" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'ui_mode'::"text")) STORED,
    "url" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'url'::"text")) STORED,
    "wallet_options" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'wallet_options'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL,
    "amount_subtotal" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_subtotal'::"text"))::bigint) STORED,
    "amount_total" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_total'::"text"))::bigint) STORED
);


ALTER TABLE "stripe"."checkout_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."coupons" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "name" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'name'::"text")) STORED,
    "valid" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'valid'::"text"))::boolean) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "updated" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'updated'::"text"))::integer) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "duration" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'duration'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "redeem_by" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'redeem_by'::"text"))::integer) STORED,
    "amount_off" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_off'::"text"))::bigint) STORED,
    "percent_off" double precision GENERATED ALWAYS AS ((("_raw_data" ->> 'percent_off'::"text"))::double precision) STORED,
    "times_redeemed" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'times_redeemed'::"text"))::bigint) STORED,
    "max_redemptions" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'max_redemptions'::"text"))::bigint) STORED,
    "duration_in_months" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'duration_in_months'::"text"))::bigint) STORED,
    "percent_off_precise" double precision GENERATED ALWAYS AS ((("_raw_data" ->> 'percent_off_precise'::"text"))::double precision) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."credit_notes" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "customer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer'::"text")) STORED,
    "customer_balance_transaction" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer_balance_transaction'::"text")) STORED,
    "discount_amounts" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'discount_amounts'::"text")) STORED,
    "invoice" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'invoice'::"text")) STORED,
    "lines" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'lines'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "memo" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'memo'::"text")) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "number" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'number'::"text")) STORED,
    "pdf" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'pdf'::"text")) STORED,
    "reason" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'reason'::"text")) STORED,
    "refund" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'refund'::"text")) STORED,
    "shipping_cost" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'shipping_cost'::"text")) STORED,
    "status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'status'::"text")) STORED,
    "tax_amounts" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'tax_amounts'::"text")) STORED,
    "type" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'type'::"text")) STORED,
    "voided_at" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'voided_at'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL,
    "amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount'::"text"))::bigint) STORED,
    "amount_shipping" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_shipping'::"text"))::bigint) STORED,
    "discount_amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'discount_amount'::"text"))::bigint) STORED,
    "out_of_band_amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'out_of_band_amount'::"text"))::bigint) STORED,
    "subtotal" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'subtotal'::"text"))::bigint) STORED,
    "subtotal_excluding_tax" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'subtotal_excluding_tax'::"text"))::bigint) STORED,
    "total" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'total'::"text"))::bigint) STORED,
    "total_excluding_tax" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'total_excluding_tax'::"text"))::bigint) STORED
);


ALTER TABLE "stripe"."credit_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."customers" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "address" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'address'::"text")) STORED,
    "description" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'description'::"text")) STORED,
    "email" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'email'::"text")) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "name" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'name'::"text")) STORED,
    "phone" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'phone'::"text")) STORED,
    "shipping" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'shipping'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "default_source" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'default_source'::"text")) STORED,
    "delinquent" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'delinquent'::"text"))::boolean) STORED,
    "discount" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'discount'::"text")) STORED,
    "invoice_prefix" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'invoice_prefix'::"text")) STORED,
    "invoice_settings" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'invoice_settings'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "next_invoice_sequence" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'next_invoice_sequence'::"text"))::integer) STORED,
    "preferred_locales" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'preferred_locales'::"text")) STORED,
    "tax_exempt" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'tax_exempt'::"text")) STORED,
    "deleted" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'deleted'::"text"))::boolean) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL,
    "balance" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'balance'::"text"))::bigint) STORED
);


ALTER TABLE "stripe"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."disputes" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount'::"text"))::bigint) STORED,
    "charge" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'charge'::"text")) STORED,
    "reason" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'reason'::"text")) STORED,
    "status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'status'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "updated" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'updated'::"text"))::integer) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "evidence" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'evidence'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "evidence_details" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'evidence_details'::"text")) STORED,
    "balance_transactions" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'balance_transactions'::"text")) STORED,
    "is_charge_refundable" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'is_charge_refundable'::"text"))::boolean) STORED,
    "payment_intent" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_intent'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."disputes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."early_fraud_warnings" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "actionable" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'actionable'::"text"))::boolean) STORED,
    "charge" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'charge'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "fraud_type" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'fraud_type'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "payment_intent" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_intent'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."early_fraud_warnings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."events" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "data" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'data'::"text")) STORED,
    "type" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'type'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "request" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'request'::"text")) STORED,
    "updated" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'updated'::"text"))::integer) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "api_version" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'api_version'::"text")) STORED,
    "pending_webhooks" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'pending_webhooks'::"text"))::bigint) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."exchange_rates_from_usd" (
    "_raw_data" "jsonb" NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_updated_at" timestamp with time zone DEFAULT "now"(),
    "_account_id" "text" NOT NULL,
    "date" "date" NOT NULL,
    "sell_currency" "text" NOT NULL,
    "buy_currency_exchange_rates" "text" GENERATED ALWAYS AS (NULLIF(("_raw_data" ->> 'buy_currency_exchange_rates'::"text"), ''::"text")) STORED
);


ALTER TABLE "stripe"."exchange_rates_from_usd" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."features" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "name" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'name'::"text")) STORED,
    "lookup_key" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'lookup_key'::"text")) STORED,
    "active" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'active'::"text"))::boolean) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."features" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."invoices" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "auto_advance" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'auto_advance'::"text"))::boolean) STORED,
    "collection_method" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'collection_method'::"text")) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "description" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'description'::"text")) STORED,
    "hosted_invoice_url" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'hosted_invoice_url'::"text")) STORED,
    "lines" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'lines'::"text")) STORED,
    "period_end" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'period_end'::"text"))::integer) STORED,
    "period_start" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'period_start'::"text"))::integer) STORED,
    "status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'status'::"text")) STORED,
    "total" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'total'::"text"))::bigint) STORED,
    "account_country" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'account_country'::"text")) STORED,
    "account_name" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'account_name'::"text")) STORED,
    "account_tax_ids" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'account_tax_ids'::"text")) STORED,
    "amount_due" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_due'::"text"))::bigint) STORED,
    "amount_paid" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_paid'::"text"))::bigint) STORED,
    "amount_remaining" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_remaining'::"text"))::bigint) STORED,
    "application_fee_amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'application_fee_amount'::"text"))::bigint) STORED,
    "attempt_count" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'attempt_count'::"text"))::integer) STORED,
    "attempted" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'attempted'::"text"))::boolean) STORED,
    "billing_reason" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'billing_reason'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "custom_fields" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'custom_fields'::"text")) STORED,
    "customer_address" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'customer_address'::"text")) STORED,
    "customer_email" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer_email'::"text")) STORED,
    "customer_name" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer_name'::"text")) STORED,
    "customer_phone" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer_phone'::"text")) STORED,
    "customer_shipping" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'customer_shipping'::"text")) STORED,
    "customer_tax_exempt" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer_tax_exempt'::"text")) STORED,
    "customer_tax_ids" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'customer_tax_ids'::"text")) STORED,
    "default_tax_rates" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'default_tax_rates'::"text")) STORED,
    "discount" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'discount'::"text")) STORED,
    "discounts" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'discounts'::"text")) STORED,
    "due_date" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'due_date'::"text"))::integer) STORED,
    "footer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'footer'::"text")) STORED,
    "invoice_pdf" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'invoice_pdf'::"text")) STORED,
    "last_finalization_error" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'last_finalization_error'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "next_payment_attempt" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'next_payment_attempt'::"text"))::integer) STORED,
    "number" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'number'::"text")) STORED,
    "paid" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'paid'::"text"))::boolean) STORED,
    "payment_settings" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'payment_settings'::"text")) STORED,
    "receipt_number" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'receipt_number'::"text")) STORED,
    "statement_descriptor" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'statement_descriptor'::"text")) STORED,
    "status_transitions" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'status_transitions'::"text")) STORED,
    "total_discount_amounts" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'total_discount_amounts'::"text")) STORED,
    "total_tax_amounts" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'total_tax_amounts'::"text")) STORED,
    "transfer_data" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'transfer_data'::"text")) STORED,
    "webhooks_delivered_at" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'webhooks_delivered_at'::"text"))::integer) STORED,
    "customer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer'::"text")) STORED,
    "subscription" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'subscription'::"text")) STORED,
    "payment_intent" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_intent'::"text")) STORED,
    "default_payment_method" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'default_payment_method'::"text")) STORED,
    "default_source" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'default_source'::"text")) STORED,
    "on_behalf_of" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'on_behalf_of'::"text")) STORED,
    "charge" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'charge'::"text")) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL,
    "ending_balance" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'ending_balance'::"text"))::bigint) STORED,
    "starting_balance" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'starting_balance'::"text"))::bigint) STORED,
    "subtotal" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'subtotal'::"text"))::bigint) STORED,
    "tax" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'tax'::"text"))::bigint) STORED,
    "post_payment_credit_notes_amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'post_payment_credit_notes_amount'::"text"))::bigint) STORED,
    "pre_payment_credit_notes_amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'pre_payment_credit_notes_amount'::"text"))::bigint) STORED
);


ALTER TABLE "stripe"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."payment_intents" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "amount_details" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'amount_details'::"text")) STORED,
    "application" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'application'::"text")) STORED,
    "automatic_payment_methods" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'automatic_payment_methods'::"text")) STORED,
    "canceled_at" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'canceled_at'::"text"))::integer) STORED,
    "cancellation_reason" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'cancellation_reason'::"text")) STORED,
    "capture_method" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'capture_method'::"text")) STORED,
    "client_secret" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'client_secret'::"text")) STORED,
    "confirmation_method" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'confirmation_method'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "customer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer'::"text")) STORED,
    "description" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'description'::"text")) STORED,
    "invoice" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'invoice'::"text")) STORED,
    "last_payment_error" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'last_payment_error'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "next_action" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'next_action'::"text")) STORED,
    "on_behalf_of" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'on_behalf_of'::"text")) STORED,
    "payment_method" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_method'::"text")) STORED,
    "payment_method_options" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'payment_method_options'::"text")) STORED,
    "payment_method_types" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'payment_method_types'::"text")) STORED,
    "processing" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'processing'::"text")) STORED,
    "receipt_email" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'receipt_email'::"text")) STORED,
    "review" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'review'::"text")) STORED,
    "setup_future_usage" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'setup_future_usage'::"text")) STORED,
    "shipping" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'shipping'::"text")) STORED,
    "statement_descriptor" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'statement_descriptor'::"text")) STORED,
    "statement_descriptor_suffix" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'statement_descriptor_suffix'::"text")) STORED,
    "status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'status'::"text")) STORED,
    "transfer_data" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'transfer_data'::"text")) STORED,
    "transfer_group" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'transfer_group'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL,
    "amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount'::"text"))::bigint) STORED,
    "amount_capturable" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_capturable'::"text"))::bigint) STORED,
    "amount_received" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_received'::"text"))::bigint) STORED,
    "application_fee_amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'application_fee_amount'::"text"))::bigint) STORED
);


ALTER TABLE "stripe"."payment_intents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."payment_methods" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "customer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer'::"text")) STORED,
    "type" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'type'::"text")) STORED,
    "billing_details" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'billing_details'::"text")) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "card" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'card'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."payment_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."payouts" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "date" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'date'::"text")) STORED,
    "type" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'type'::"text")) STORED,
    "amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount'::"text"))::bigint) STORED,
    "method" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'method'::"text")) STORED,
    "status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'status'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "updated" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'updated'::"text"))::integer) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "automatic" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'automatic'::"text"))::boolean) STORED,
    "recipient" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'recipient'::"text")) STORED,
    "description" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'description'::"text")) STORED,
    "destination" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'destination'::"text")) STORED,
    "source_type" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'source_type'::"text")) STORED,
    "arrival_date" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'arrival_date'::"text")) STORED,
    "bank_account" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'bank_account'::"text")) STORED,
    "failure_code" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'failure_code'::"text")) STORED,
    "transfer_group" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'transfer_group'::"text")) STORED,
    "amount_reversed" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount_reversed'::"text"))::bigint) STORED,
    "failure_message" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'failure_message'::"text")) STORED,
    "source_transaction" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'source_transaction'::"text")) STORED,
    "balance_transaction" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'balance_transaction'::"text")) STORED,
    "statement_descriptor" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'statement_descriptor'::"text")) STORED,
    "statement_description" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'statement_description'::"text")) STORED,
    "failure_balance_transaction" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'failure_balance_transaction'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."plans" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "name" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'name'::"text")) STORED,
    "tiers" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'tiers'::"text")) STORED,
    "active" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'active'::"text"))::boolean) STORED,
    "amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount'::"text"))::bigint) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "product" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'product'::"text")) STORED,
    "updated" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'updated'::"text"))::integer) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "interval" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'interval'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "nickname" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'nickname'::"text")) STORED,
    "tiers_mode" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'tiers_mode'::"text")) STORED,
    "usage_type" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'usage_type'::"text")) STORED,
    "billing_scheme" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'billing_scheme'::"text")) STORED,
    "interval_count" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'interval_count'::"text"))::bigint) STORED,
    "aggregate_usage" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'aggregate_usage'::"text")) STORED,
    "transform_usage" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'transform_usage'::"text")) STORED,
    "trial_period_days" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'trial_period_days'::"text"))::bigint) STORED,
    "statement_descriptor" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'statement_descriptor'::"text")) STORED,
    "statement_description" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'statement_description'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."prices" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "active" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'active'::"text"))::boolean) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "nickname" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'nickname'::"text")) STORED,
    "recurring" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'recurring'::"text")) STORED,
    "type" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'type'::"text")) STORED,
    "billing_scheme" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'billing_scheme'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "lookup_key" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'lookup_key'::"text")) STORED,
    "tiers_mode" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'tiers_mode'::"text")) STORED,
    "transform_quantity" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'transform_quantity'::"text")) STORED,
    "unit_amount_decimal" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'unit_amount_decimal'::"text")) STORED,
    "product" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'product'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL,
    "unit_amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'unit_amount'::"text"))::bigint) STORED
);


ALTER TABLE "stripe"."prices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."products" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "active" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'active'::"text"))::boolean) STORED,
    "default_price" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'default_price'::"text")) STORED,
    "description" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'description'::"text")) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "name" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'name'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "images" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'images'::"text")) STORED,
    "marketing_features" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'marketing_features'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "package_dimensions" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'package_dimensions'::"text")) STORED,
    "shippable" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'shippable'::"text"))::boolean) STORED,
    "statement_descriptor" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'statement_descriptor'::"text")) STORED,
    "unit_label" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'unit_label'::"text")) STORED,
    "updated" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'updated'::"text"))::integer) STORED,
    "url" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'url'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."refunds" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "balance_transaction" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'balance_transaction'::"text")) STORED,
    "charge" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'charge'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "currency" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'currency'::"text")) STORED,
    "destination_details" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'destination_details'::"text")) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "payment_intent" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_intent'::"text")) STORED,
    "reason" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'reason'::"text")) STORED,
    "receipt_number" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'receipt_number'::"text")) STORED,
    "source_transfer_reversal" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'source_transfer_reversal'::"text")) STORED,
    "status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'status'::"text")) STORED,
    "transfer_reversal" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'transfer_reversal'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL,
    "amount" bigint GENERATED ALWAYS AS ((("_raw_data" ->> 'amount'::"text"))::bigint) STORED
);


ALTER TABLE "stripe"."refunds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."reviews" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "billing_zip" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'billing_zip'::"text")) STORED,
    "charge" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'charge'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "closed_reason" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'closed_reason'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "ip_address" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'ip_address'::"text")) STORED,
    "ip_address_location" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'ip_address_location'::"text")) STORED,
    "open" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'open'::"text"))::boolean) STORED,
    "opened_reason" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'opened_reason'::"text")) STORED,
    "payment_intent" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_intent'::"text")) STORED,
    "reason" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'reason'::"text")) STORED,
    "session" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'session'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."setup_intents" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "customer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer'::"text")) STORED,
    "description" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'description'::"text")) STORED,
    "payment_method" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'payment_method'::"text")) STORED,
    "status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'status'::"text")) STORED,
    "usage" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'usage'::"text")) STORED,
    "cancellation_reason" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'cancellation_reason'::"text")) STORED,
    "latest_attempt" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'latest_attempt'::"text")) STORED,
    "mandate" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'mandate'::"text")) STORED,
    "single_use_mandate" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'single_use_mandate'::"text")) STORED,
    "on_behalf_of" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'on_behalf_of'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."setup_intents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."subscription_item_change_events_v2_beta" (
    "_raw_data" "jsonb" NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_updated_at" timestamp with time zone DEFAULT "now"(),
    "_account_id" "text" NOT NULL,
    "event_timestamp" timestamp with time zone NOT NULL,
    "event_type" "text" NOT NULL,
    "subscription_item_id" "text" NOT NULL,
    "currency" "text" GENERATED ALWAYS AS (NULLIF(("_raw_data" ->> 'currency'::"text"), ''::"text")) STORED,
    "mrr_change" bigint GENERATED ALWAYS AS ((NULLIF(("_raw_data" ->> 'mrr_change'::"text"), ''::"text"))::bigint) STORED,
    "quantity_change" bigint GENERATED ALWAYS AS ((NULLIF(("_raw_data" ->> 'quantity_change'::"text"), ''::"text"))::bigint) STORED,
    "subscription_id" "text" GENERATED ALWAYS AS (NULLIF(("_raw_data" ->> 'subscription_id'::"text"), ''::"text")) STORED,
    "customer_id" "text" GENERATED ALWAYS AS (NULLIF(("_raw_data" ->> 'customer_id'::"text"), ''::"text")) STORED,
    "price_id" "text" GENERATED ALWAYS AS (NULLIF(("_raw_data" ->> 'price_id'::"text"), ''::"text")) STORED,
    "product_id" "text" GENERATED ALWAYS AS (NULLIF(("_raw_data" ->> 'product_id'::"text"), ''::"text")) STORED,
    "local_event_timestamp" "text" GENERATED ALWAYS AS (NULLIF(("_raw_data" ->> 'local_event_timestamp'::"text"), ''::"text")) STORED
);


ALTER TABLE "stripe"."subscription_item_change_events_v2_beta" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."subscription_items" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "billing_thresholds" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'billing_thresholds'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "deleted" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'deleted'::"text"))::boolean) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "quantity" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'quantity'::"text"))::integer) STORED,
    "price" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'price'::"text")) STORED,
    "subscription" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'subscription'::"text")) STORED,
    "tax_rates" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'tax_rates'::"text")) STORED,
    "current_period_end" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'current_period_end'::"text"))::integer) STORED,
    "current_period_start" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'current_period_start'::"text"))::integer) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."subscription_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."subscription_schedules" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "application" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'application'::"text")) STORED,
    "canceled_at" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'canceled_at'::"text"))::integer) STORED,
    "completed_at" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'completed_at'::"text"))::integer) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "current_phase" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'current_phase'::"text")) STORED,
    "customer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer'::"text")) STORED,
    "default_settings" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'default_settings'::"text")) STORED,
    "end_behavior" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'end_behavior'::"text")) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "phases" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'phases'::"text")) STORED,
    "released_at" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'released_at'::"text"))::integer) STORED,
    "released_subscription" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'released_subscription'::"text")) STORED,
    "status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'status'::"text")) STORED,
    "subscription" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'subscription'::"text")) STORED,
    "test_clock" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'test_clock'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."subscription_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."subscriptions" (
    "_updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "cancel_at_period_end" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'cancel_at_period_end'::"text"))::boolean) STORED,
    "current_period_end" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'current_period_end'::"text"))::integer) STORED,
    "current_period_start" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'current_period_start'::"text"))::integer) STORED,
    "default_payment_method" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'default_payment_method'::"text")) STORED,
    "items" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'items'::"text")) STORED,
    "metadata" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'metadata'::"text")) STORED,
    "pending_setup_intent" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'pending_setup_intent'::"text")) STORED,
    "pending_update" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'pending_update'::"text")) STORED,
    "status" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'status'::"text")) STORED,
    "application_fee_percent" double precision GENERATED ALWAYS AS ((("_raw_data" ->> 'application_fee_percent'::"text"))::double precision) STORED,
    "billing_cycle_anchor" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'billing_cycle_anchor'::"text"))::integer) STORED,
    "billing_thresholds" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'billing_thresholds'::"text")) STORED,
    "cancel_at" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'cancel_at'::"text"))::integer) STORED,
    "canceled_at" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'canceled_at'::"text"))::integer) STORED,
    "collection_method" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'collection_method'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "days_until_due" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'days_until_due'::"text"))::integer) STORED,
    "default_source" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'default_source'::"text")) STORED,
    "default_tax_rates" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'default_tax_rates'::"text")) STORED,
    "discount" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'discount'::"text")) STORED,
    "ended_at" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'ended_at'::"text"))::integer) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "next_pending_invoice_item_invoice" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'next_pending_invoice_item_invoice'::"text"))::integer) STORED,
    "pause_collection" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'pause_collection'::"text")) STORED,
    "pending_invoice_item_interval" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'pending_invoice_item_interval'::"text")) STORED,
    "start_date" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'start_date'::"text"))::integer) STORED,
    "transfer_data" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'transfer_data'::"text")) STORED,
    "trial_end" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'trial_end'::"text")) STORED,
    "trial_start" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'trial_start'::"text")) STORED,
    "schedule" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'schedule'::"text")) STORED,
    "customer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer'::"text")) STORED,
    "latest_invoice" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'latest_invoice'::"text")) STORED,
    "plan" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'plan'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."subscriptions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "stripe"."sync_runs" AS
 SELECT "r"."_account_id" AS "account_id",
    "r"."started_at",
    "r"."closed_at",
    "r"."triggered_by",
    "r"."max_concurrent",
    COALESCE("sum"("o"."processed_count"), (0)::bigint) AS "total_processed",
    "count"("o".*) AS "total_objects",
    "count"(*) FILTER (WHERE ("o"."status" = 'complete'::"text")) AS "complete_count",
    "count"(*) FILTER (WHERE ("o"."status" = 'error'::"text")) AS "error_count",
    "count"(*) FILTER (WHERE ("o"."status" = 'running'::"text")) AS "running_count",
    "count"(*) FILTER (WHERE ("o"."status" = 'pending'::"text")) AS "pending_count",
    "string_agg"("o"."error_message", '; '::"text") FILTER (WHERE ("o"."error_message" IS NOT NULL)) AS "error_message",
        CASE
            WHEN (("r"."closed_at" IS NULL) AND ("count"(*) FILTER (WHERE ("o"."status" = 'running'::"text")) > 0)) THEN 'running'::"text"
            WHEN (("r"."closed_at" IS NULL) AND (("count"("o".*) = 0) OR ("count"("o".*) = "count"(*) FILTER (WHERE ("o"."status" = 'pending'::"text"))))) THEN 'pending'::"text"
            WHEN ("r"."closed_at" IS NULL) THEN 'running'::"text"
            WHEN ("count"(*) FILTER (WHERE ("o"."status" = 'error'::"text")) > 0) THEN 'error'::"text"
            ELSE 'complete'::"text"
        END AS "status"
   FROM ("stripe"."_sync_runs" "r"
     LEFT JOIN "stripe"."_sync_obj_runs" "o" ON ((("o"."_account_id" = "r"."_account_id") AND ("o"."run_started_at" = "r"."started_at"))))
  GROUP BY "r"."_account_id", "r"."started_at", "r"."closed_at", "r"."triggered_by", "r"."max_concurrent";


ALTER VIEW "stripe"."sync_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "stripe"."tax_ids" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" "jsonb",
    "_account_id" "text" NOT NULL,
    "object" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'object'::"text")) STORED,
    "country" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'country'::"text")) STORED,
    "customer" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'customer'::"text")) STORED,
    "type" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'type'::"text")) STORED,
    "value" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'value'::"text")) STORED,
    "created" integer GENERATED ALWAYS AS ((("_raw_data" ->> 'created'::"text"))::integer) STORED,
    "livemode" boolean GENERATED ALWAYS AS ((("_raw_data" ->> 'livemode'::"text"))::boolean) STORED,
    "owner" "jsonb" GENERATED ALWAYS AS (("_raw_data" -> 'owner'::"text")) STORED,
    "id" "text" GENERATED ALWAYS AS (("_raw_data" ->> 'id'::"text")) STORED NOT NULL
);


ALTER TABLE "stripe"."tax_ids" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_attendees"
    ADD CONSTRAINT "activity_attendees_pkey" PRIMARY KEY ("activity_id", "user_id");



ALTER TABLE ONLY "public"."activity_messages"
    ADD CONSTRAINT "activity_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ad_impressions"
    ADD CONSTRAINT "ad_impressions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_config"
    ADD CONSTRAINT "ai_config_feature_key" UNIQUE ("feature");



ALTER TABLE ONLY "public"."ai_config"
    ADD CONSTRAINT "ai_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_decisions"
    ADD CONSTRAINT "ai_decisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_pkey" PRIMARY KEY ("blocker_id", "blocked_id");



ALTER TABLE ONLY "public"."business_bookings"
    ADD CONSTRAINT "business_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."business_reviews"
    ADD CONSTRAINT "business_reviews_business_id_user_id_key" UNIQUE ("business_id", "user_id");



ALTER TABLE ONLY "public"."business_reviews"
    ADD CONSTRAINT "business_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."city_challenges"
    ADD CONSTRAINT "city_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."city_energy_states"
    ADD CONSTRAINT "city_energy_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."compliance_regions"
    ADD CONSTRAINT "compliance_regions_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."content_blocks"
    ADD CONSTRAINT "content_blocks_page_block_key_locale_key" UNIQUE ("page", "block_key", "locale");



ALTER TABLE ONLY "public"."content_blocks"
    ADD CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_comments"
    ADD CONSTRAINT "content_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_likes"
    ADD CONSTRAINT "content_likes_pkey" PRIMARY KEY ("content_id", "user_id");



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_saves"
    ADD CONSTRAINT "content_saves_pkey" PRIMARY KEY ("content_id", "user_id");



ALTER TABLE ONLY "public"."content_views"
    ADD CONSTRAINT "content_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crossed_paths"
    ADD CONSTRAINT "crossed_paths_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."crossed_paths"
    ADD CONSTRAINT "crossed_paths_user1_id_user2_id_key" UNIQUE ("user1_id", "user2_id");



ALTER TABLE ONLY "public"."custom_themes"
    ADD CONSTRAINT "custom_themes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."data_requests"
    ADD CONSTRAINT "data_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dating_matches"
    ADD CONSTRAINT "dating_matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dating_messages"
    ADD CONSTRAINT "dating_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dating_profiles"
    ADD CONSTRAINT "dating_profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."dating_swipes"
    ADD CONSTRAINT "dating_swipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dating_swipes"
    ADD CONSTRAINT "dating_swipes_swiper_id_swiped_id_context_key" UNIQUE ("swiper_id", "swiped_id", "context");



ALTER TABLE ONLY "public"."digital_assets"
    ADD CONSTRAINT "digital_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_templates"
    ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("name");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id", "following_id");



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_group_id_invitee_id_key" UNIQUE ("group_id", "invitee_id");



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id");



ALTER TABLE ONLY "public"."group_messages"
    ADD CONSTRAINT "group_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hashtag_stats"
    ADD CONSTRAINT "hashtag_stats_pkey" PRIMARY KEY ("hashtag");



ALTER TABLE ONLY "public"."leaderboard_entries"
    ADD CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("leaderboard_id", "user_id", "period_start");



ALTER TABLE ONLY "public"."leaderboards"
    ADD CONSTRAINT "leaderboards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."live_streams"
    ADD CONSTRAINT "live_streams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."live_streams"
    ADD CONSTRAINT "live_streams_stream_key_key" UNIQUE ("stream_key");



ALTER TABLE ONLY "public"."live_streams"
    ADD CONSTRAINT "live_streams_webrtc_room_id_key" UNIQUE ("webrtc_room_id");



ALTER TABLE ONLY "public"."location_history"
    ADD CONSTRAINT "location_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."loneliness_detection"
    ADD CONSTRAINT "loneliness_detection_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_user1_id_user2_id_key" UNIQUE ("user1_id", "user2_id");



ALTER TABLE ONLY "public"."memory_capsules"
    ADD CONSTRAINT "memory_capsules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moment_drops"
    ADD CONSTRAINT "moment_drops_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."panic_events"
    ADD CONSTRAINT "panic_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."platform_config"
    ADD CONSTRAINT "platform_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."proximity_ads"
    ADD CONSTRAINT "proximity_ads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_user_id_token_key" UNIQUE ("user_id", "token");



ALTER TABLE ONLY "public"."random_chat_messages"
    ADD CONSTRAINT "random_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."random_chat_queue"
    ADD CONSTRAINT "random_chat_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."random_chat_queue"
    ADD CONSTRAINT "random_chat_queue_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."random_chats"
    ADD CONSTRAINT "random_chats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."random_connect_queue"
    ADD CONSTRAINT "random_connect_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."random_connect_queue"
    ADD CONSTRAINT "random_connect_queue_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."random_connections"
    ADD CONSTRAINT "random_connections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."random_date_queue"
    ADD CONSTRAINT "random_date_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."random_date_queue"
    ADD CONSTRAINT "random_date_queue_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."social_signals"
    ADD CONSTRAINT "social_signals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stream_messages"
    ADD CONSTRAINT "stream_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stream_participants"
    ADD CONSTRAINT "stream_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stream_participants"
    ADD CONSTRAINT "stream_participants_stream_id_user_id_key" UNIQUE ("stream_id", "user_id");



ALTER TABLE ONLY "public"."stream_viewers"
    ADD CONSTRAINT "stream_viewers_pkey" PRIMARY KEY ("stream_id", "user_id");



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_stripe_account_id_key" UNIQUE ("stripe_account_id");



ALTER TABLE ONLY "public"."subscription_events"
    ADD CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("user_id", "achievement_id");



ALTER TABLE ONLY "public"."user_assets"
    ADD CONSTRAINT "user_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_consent_type_key" UNIQUE ("user_id", "consent_type");



ALTER TABLE ONLY "public"."user_identity"
    ADD CONSTRAINT "user_identity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_identity"
    ADD CONSTRAINT "user_identity_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_metrics"
    ADD CONSTRAINT "user_metrics_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_presence"
    ADD CONSTRAINT "user_presence_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_creator_handle_key" UNIQUE ("creator_handle");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_stripe_connect_id_key" UNIQUE ("stripe_connect_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_social_roles"
    ADD CONSTRAINT "user_social_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_social_roles"
    ADD CONSTRAINT "user_social_roles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."_migrations"
    ADD CONSTRAINT "_migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "stripe"."_migrations"
    ADD CONSTRAINT "_migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."_sync_obj_runs"
    ADD CONSTRAINT "_sync_obj_run_pkey" PRIMARY KEY ("_account_id", "run_started_at", "object");



ALTER TABLE ONLY "stripe"."_sync_runs"
    ADD CONSTRAINT "_sync_run_pkey" PRIMARY KEY ("_account_id", "started_at");



ALTER TABLE ONLY "stripe"."accounts"
    ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."active_entitlements"
    ADD CONSTRAINT "active_entitlements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."charges"
    ADD CONSTRAINT "charges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."checkout_session_line_items"
    ADD CONSTRAINT "checkout_session_line_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."checkout_sessions"
    ADD CONSTRAINT "checkout_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."credit_notes"
    ADD CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."disputes"
    ADD CONSTRAINT "disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."early_fraud_warnings"
    ADD CONSTRAINT "early_fraud_warnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."exchange_rates_from_usd"
    ADD CONSTRAINT "exchange_rates_from_usd_pkey" PRIMARY KEY ("_account_id", "date", "sell_currency");



ALTER TABLE ONLY "stripe"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."_managed_webhooks"
    ADD CONSTRAINT "managed_webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."_managed_webhooks"
    ADD CONSTRAINT "managed_webhooks_url_account_unique" UNIQUE ("url", "account_id");



ALTER TABLE ONLY "stripe"."_sync_runs"
    ADD CONSTRAINT "one_active_run_per_account" EXCLUDE USING "btree" ("_account_id" WITH =) WHERE (("closed_at" IS NULL));



ALTER TABLE ONLY "stripe"."payment_intents"
    ADD CONSTRAINT "payment_intents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."payment_methods"
    ADD CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."payouts"
    ADD CONSTRAINT "payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."plans"
    ADD CONSTRAINT "plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."prices"
    ADD CONSTRAINT "prices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."refunds"
    ADD CONSTRAINT "refunds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."setup_intents"
    ADD CONSTRAINT "setup_intents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."subscription_item_change_events_v2_beta"
    ADD CONSTRAINT "subscription_item_change_events_v2_beta_pkey" PRIMARY KEY ("_account_id", "event_timestamp", "event_type", "subscription_item_id");



ALTER TABLE ONLY "stripe"."subscription_items"
    ADD CONSTRAINT "subscription_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."subscription_schedules"
    ADD CONSTRAINT "subscription_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "stripe"."tax_ids"
    ADD CONSTRAINT "tax_ids_pkey" PRIMARY KEY ("id");



CREATE INDEX "activities_expires_at_idx" ON "public"."activities" USING "btree" ("expires_at");



CREATE INDEX "activities_location_idx" ON "public"."activities" USING "gist" ("location");



CREATE INDEX "groups_location_idx" ON "public"."groups" USING "gist" ("location");



CREATE INDEX "idx_activities_free" ON "public"."activities" USING "btree" ("is_free") WHERE ("is_free" = true);



CREATE INDEX "idx_activities_location" ON "public"."activities" USING "gist" ("location");



CREATE INDEX "idx_activities_status" ON "public"."activities" USING "btree" ("status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_activities_time" ON "public"."activities" USING "btree" ("start_time", "end_time");



CREATE INDEX "idx_activities_type" ON "public"."activities" USING "btree" ("activity_type");



CREATE INDEX "idx_activity_attendees_user" ON "public"."activity_attendees" USING "btree" ("user_id");



CREATE INDEX "idx_activity_messages_activity" ON "public"."activity_messages" USING "btree" ("activity_id", "created_at" DESC);



CREATE INDEX "idx_ad_impressions_ad" ON "public"."ad_impressions" USING "btree" ("ad_id", "created_at" DESC);



CREATE INDEX "idx_ai_decisions_feature" ON "public"."ai_decisions" USING "btree" ("feature", "created_at" DESC);



CREATE INDEX "idx_ai_decisions_related" ON "public"."ai_decisions" USING "btree" ("related_type", "related_id");



CREATE INDEX "idx_audit_log_action" ON "public"."audit_log" USING "btree" ("action", "created_at" DESC);



CREATE INDEX "idx_audit_log_resource" ON "public"."audit_log" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_audit_log_user" ON "public"."audit_log" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_automation_rules_event" ON "public"."automation_rules" USING "btree" ("trigger_event") WHERE ("is_active" = true);



CREATE INDEX "idx_business_bookings_business" ON "public"."business_bookings" USING "btree" ("business_id", "booking_date");



CREATE INDEX "idx_business_bookings_user" ON "public"."business_bookings" USING "btree" ("user_id");



CREATE INDEX "idx_business_reviews_business" ON "public"."business_reviews" USING "btree" ("business_id", "created_at" DESC);



CREATE INDEX "idx_businesses_category" ON "public"."businesses" USING "btree" ("category");



CREATE INDEX "idx_businesses_location" ON "public"."businesses" USING "gist" ("location");



CREATE INDEX "idx_businesses_slug" ON "public"."businesses" USING "btree" ("slug");



CREATE INDEX "idx_businesses_status" ON "public"."businesses" USING "btree" ("status");



CREATE INDEX "idx_businesses_verified" ON "public"."businesses" USING "btree" ("is_verified") WHERE ("is_verified" = true);



CREATE INDEX "idx_city_challenges_active" ON "public"."city_challenges" USING "btree" ("is_active", "end_time");



CREATE INDEX "idx_city_energy_states_energy" ON "public"."city_energy_states" USING "btree" ("energy_score" DESC);



CREATE INDEX "idx_content_blocks_page" ON "public"."content_blocks" USING "btree" ("page", "locale");



CREATE INDEX "idx_content_comments_content" ON "public"."content_comments" USING "btree" ("content_id", "created_at" DESC);



CREATE INDEX "idx_content_creator" ON "public"."content" USING "btree" ("creator_id", "created_at" DESC);



CREATE INDEX "idx_content_hashtags" ON "public"."content" USING "gin" ("hashtags");



CREATE INDEX "idx_content_local" ON "public"."content" USING "btree" ("is_local") WHERE ("is_local" = true);



CREATE INDEX "idx_content_location" ON "public"."content" USING "gist" ("location");



CREATE INDEX "idx_content_moderation" ON "public"."content" USING "btree" ("moderation_status");



CREATE INDEX "idx_content_tags" ON "public"."content" USING "gin" ("tags");



CREATE INDEX "idx_content_type" ON "public"."content" USING "btree" ("content_type");



CREATE INDEX "idx_content_views_content" ON "public"."content_views" USING "btree" ("content_id", "created_at" DESC);



CREATE UNIQUE INDEX "idx_conversations_unique_pair" ON "public"."conversations" USING "btree" (LEAST("user1_id", "user2_id"), GREATEST("user1_id", "user2_id"));



CREATE INDEX "idx_conversations_user1" ON "public"."conversations" USING "btree" ("user1_id", "last_message_at" DESC);



CREATE INDEX "idx_conversations_user2" ON "public"."conversations" USING "btree" ("user2_id", "last_message_at" DESC);



CREATE INDEX "idx_crossed_paths_user1" ON "public"."crossed_paths" USING "btree" ("user1_id", "crossed_at" DESC);



CREATE INDEX "idx_crossed_paths_user2" ON "public"."crossed_paths" USING "btree" ("user2_id", "crossed_at" DESC);



CREATE INDEX "idx_custom_themes_public" ON "public"."custom_themes" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_custom_themes_user_id" ON "public"."custom_themes" USING "btree" ("user_id");



CREATE INDEX "idx_data_requests_status" ON "public"."data_requests" USING "btree" ("status");



CREATE INDEX "idx_data_requests_user" ON "public"."data_requests" USING "btree" ("user_id");



CREATE INDEX "idx_dating_matches_user1" ON "public"."dating_matches" USING "btree" ("user1_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_dating_matches_user2" ON "public"."dating_matches" USING "btree" ("user2_id") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_dating_messages_match" ON "public"."dating_messages" USING "btree" ("match_id", "created_at" DESC);



CREATE INDEX "idx_dating_swipes_swiped" ON "public"."dating_swipes" USING "btree" ("swiped_id");



CREATE INDEX "idx_dating_swipes_swiped_id" ON "public"."dating_swipes" USING "btree" ("swiped_id");



CREATE INDEX "idx_dating_swipes_swiper" ON "public"."dating_swipes" USING "btree" ("swiper_id", "created_at" DESC);



CREATE INDEX "idx_dating_swipes_swiper_id" ON "public"."dating_swipes" USING "btree" ("swiper_id");



CREATE INDEX "idx_digital_assets_location" ON "public"."digital_assets" USING "gist" ("location");



CREATE INDEX "idx_dm_conversation" ON "public"."direct_messages" USING "btree" (LEAST("sender_id", "recipient_id"), GREATEST("sender_id", "recipient_id"), "created_at" DESC);



CREATE INDEX "idx_dm_recipient" ON "public"."direct_messages" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "idx_dm_sender" ON "public"."direct_messages" USING "btree" ("sender_id", "created_at" DESC);



CREATE INDEX "idx_follows_follower" ON "public"."follows" USING "btree" ("follower_id");



CREATE INDEX "idx_follows_following" ON "public"."follows" USING "btree" ("following_id");



CREATE INDEX "idx_group_members_user" ON "public"."group_members" USING "btree" ("user_id");



CREATE INDEX "idx_group_messages_group" ON "public"."group_messages" USING "btree" ("group_id", "created_at" DESC);



CREATE INDEX "idx_group_messages_sender" ON "public"."group_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_groups_category" ON "public"."groups" USING "btree" ("category");



CREATE INDEX "idx_groups_location" ON "public"."groups" USING "gist" ("location");



CREATE INDEX "idx_groups_public" ON "public"."groups" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_groups_vibe_tags" ON "public"."groups" USING "gin" ("vibe_tags");



CREATE INDEX "idx_live_streams_active" ON "public"."live_streams" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_live_streams_host" ON "public"."live_streams" USING "btree" ("host_id");



CREATE INDEX "idx_live_streams_host_id" ON "public"."live_streams" USING "btree" ("host_id");



CREATE INDEX "idx_live_streams_is_active" ON "public"."live_streams" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_live_streams_location" ON "public"."live_streams" USING "gist" ("location");



CREATE INDEX "idx_live_streams_type" ON "public"."live_streams" USING "btree" ("stream_type");



CREATE INDEX "idx_location_history_location" ON "public"."location_history" USING "gist" ("location");



CREATE INDEX "idx_location_history_user" ON "public"."location_history" USING "btree" ("user_id", "recorded_at" DESC);



CREATE INDEX "idx_memory_capsules_user_id" ON "public"."memory_capsules" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_moment_drops_active" ON "public"."moment_drops" USING "btree" ("is_active", "end_time");



CREATE INDEX "idx_notifications_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_payments_user" ON "public"."payments" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_platform_config_category" ON "public"."platform_config" USING "btree" ("category");



CREATE INDEX "idx_proximity_ads_active" ON "public"."proximity_ads" USING "btree" ("is_active", "is_approved") WHERE (("is_active" = true) AND ("is_approved" = true));



CREATE INDEX "idx_proximity_ads_business" ON "public"."proximity_ads" USING "btree" ("business_id");



CREATE INDEX "idx_proximity_ads_time" ON "public"."proximity_ads" USING "btree" ("start_time", "end_time");



CREATE INDEX "idx_push_tokens_user" ON "public"."push_tokens" USING "btree" ("user_id") WHERE ("is_active" = true);



CREATE INDEX "idx_random_chat_messages" ON "public"."random_chat_messages" USING "btree" ("chat_id", "created_at");



CREATE INDEX "idx_random_chat_queue_location" ON "public"."random_chat_queue" USING "gist" ("location");



CREATE INDEX "idx_random_connect_queue_location" ON "public"."random_connect_queue" USING "gist" ("location");



CREATE INDEX "idx_random_connect_queue_type" ON "public"."random_connect_queue" USING "btree" ("connection_type");



CREATE INDEX "idx_random_connections_user1" ON "public"."random_connections" USING "btree" ("user1_id", "started_at" DESC);



CREATE INDEX "idx_random_connections_user2" ON "public"."random_connections" USING "btree" ("user2_id", "started_at" DESC);



CREATE INDEX "idx_random_date_queue_location" ON "public"."random_date_queue" USING "gist" ("location");



CREATE INDEX "idx_reports_reported" ON "public"."reports" USING "btree" ("reported_user_id");



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status");



CREATE INDEX "idx_social_signals_user_active" ON "public"."social_signals" USING "btree" ("user_id", "is_active", "start_time" DESC);



CREATE INDEX "idx_stream_messages_stream" ON "public"."stream_messages" USING "btree" ("stream_id", "created_at" DESC);



CREATE INDEX "idx_stream_participants_stream_id" ON "public"."stream_participants" USING "btree" ("stream_id");



CREATE INDEX "idx_stream_participants_user_id" ON "public"."stream_participants" USING "btree" ("user_id");



CREATE INDEX "idx_user_assets_user" ON "public"."user_assets" USING "btree" ("user_id");



CREATE INDEX "idx_user_consents_user" ON "public"."user_consents" USING "btree" ("user_id");



CREATE INDEX "idx_user_identity_user_id" ON "public"."user_identity" USING "btree" ("user_id");



CREATE INDEX "idx_user_preferences_user_id" ON "public"."user_preferences" USING "btree" ("user_id");



CREATE INDEX "idx_user_presence_availability" ON "public"."user_presence" USING "btree" ("availability");



CREATE INDEX "idx_user_presence_location" ON "public"."user_presence" USING "gist" ("location");



CREATE INDEX "idx_user_presence_visible" ON "public"."user_presence" USING "btree" ("is_visible") WHERE ("is_visible" = true);



CREATE INDEX "idx_user_profiles_creator" ON "public"."user_profiles" USING "btree" ("is_creator") WHERE ("is_creator" = true);



CREATE INDEX "idx_user_profiles_interests" ON "public"."user_profiles" USING "gin" ("interests");



CREATE INDEX "idx_user_profiles_location" ON "public"."user_profiles" USING "btree" ("location_city", "location_country");



CREATE INDEX "idx_user_profiles_stripe_connect" ON "public"."user_profiles" USING "btree" ("stripe_connect_id");



CREATE INDEX "idx_user_profiles_stripe_customer" ON "public"."user_profiles" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_user_profiles_subscription_status" ON "public"."user_profiles" USING "btree" ("subscription_status");



CREATE INDEX "idx_user_profiles_username" ON "public"."user_profiles" USING "btree" ("username");



CREATE INDEX "idx_user_profiles_vibe_tags" ON "public"."user_profiles" USING "gin" ("vibe_tags");



CREATE INDEX "idx_user_sessions_user" ON "public"."user_sessions" USING "btree" ("user_id", "is_active");



CREATE INDEX "idx_user_social_roles_active" ON "public"."user_social_roles" USING "btree" ("user_id", "is_active", "earned_at" DESC);



CREATE INDEX "idx_user_subscriptions_stripe" ON "public"."user_subscriptions" USING "btree" ("stripe_subscription_id");



CREATE INDEX "idx_user_subscriptions_user" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_withdrawals_status" ON "public"."withdrawals" USING "btree" ("status");



CREATE INDEX "idx_withdrawals_user" ON "public"."withdrawals" USING "btree" ("user_id");



CREATE INDEX "user_presence_location_idx" ON "public"."user_presence" USING "gist" ("last_known_location");



CREATE UNIQUE INDEX "active_entitlements_lookup_key_key" ON "stripe"."active_entitlements" USING "btree" ("lookup_key") WHERE ("lookup_key" IS NOT NULL);



CREATE UNIQUE INDEX "features_lookup_key_key" ON "stripe"."features" USING "btree" ("lookup_key") WHERE ("lookup_key" IS NOT NULL);



CREATE INDEX "idx_accounts_api_key_hashes" ON "stripe"."accounts" USING "gin" ("api_key_hashes");



CREATE INDEX "idx_accounts_business_name" ON "stripe"."accounts" USING "btree" ("business_name");



CREATE INDEX "idx_exchange_rates_from_usd_date" ON "stripe"."exchange_rates_from_usd" USING "btree" ("date");



CREATE INDEX "idx_exchange_rates_from_usd_sell_currency" ON "stripe"."exchange_rates_from_usd" USING "btree" ("sell_currency");



CREATE INDEX "idx_sync_obj_runs_status" ON "stripe"."_sync_obj_runs" USING "btree" ("_account_id", "run_started_at", "status");



CREATE INDEX "idx_sync_runs_account_status" ON "stripe"."_sync_runs" USING "btree" ("_account_id", "closed_at");



CREATE INDEX "stripe_active_entitlements_customer_idx" ON "stripe"."active_entitlements" USING "btree" ("customer");



CREATE INDEX "stripe_active_entitlements_feature_idx" ON "stripe"."active_entitlements" USING "btree" ("feature");



CREATE INDEX "stripe_checkout_session_line_items_price_idx" ON "stripe"."checkout_session_line_items" USING "btree" ("price");



CREATE INDEX "stripe_checkout_session_line_items_session_idx" ON "stripe"."checkout_session_line_items" USING "btree" ("checkout_session");



CREATE INDEX "stripe_checkout_sessions_customer_idx" ON "stripe"."checkout_sessions" USING "btree" ("customer");



CREATE INDEX "stripe_checkout_sessions_invoice_idx" ON "stripe"."checkout_sessions" USING "btree" ("invoice");



CREATE INDEX "stripe_checkout_sessions_payment_intent_idx" ON "stripe"."checkout_sessions" USING "btree" ("payment_intent");



CREATE INDEX "stripe_checkout_sessions_subscription_idx" ON "stripe"."checkout_sessions" USING "btree" ("subscription");



CREATE INDEX "stripe_credit_notes_customer_idx" ON "stripe"."credit_notes" USING "btree" ("customer");



CREATE INDEX "stripe_credit_notes_invoice_idx" ON "stripe"."credit_notes" USING "btree" ("invoice");



CREATE INDEX "stripe_dispute_created_idx" ON "stripe"."disputes" USING "btree" ("created");



CREATE INDEX "stripe_early_fraud_warnings_charge_idx" ON "stripe"."early_fraud_warnings" USING "btree" ("charge");



CREATE INDEX "stripe_early_fraud_warnings_payment_intent_idx" ON "stripe"."early_fraud_warnings" USING "btree" ("payment_intent");



CREATE INDEX "stripe_invoices_customer_idx" ON "stripe"."invoices" USING "btree" ("customer");



CREATE INDEX "stripe_invoices_subscription_idx" ON "stripe"."invoices" USING "btree" ("subscription");



CREATE INDEX "stripe_managed_webhooks_enabled_idx" ON "stripe"."_managed_webhooks" USING "btree" ("enabled");



CREATE INDEX "stripe_managed_webhooks_status_idx" ON "stripe"."_managed_webhooks" USING "btree" ("status");



CREATE INDEX "stripe_payment_intents_customer_idx" ON "stripe"."payment_intents" USING "btree" ("customer");



CREATE INDEX "stripe_payment_intents_invoice_idx" ON "stripe"."payment_intents" USING "btree" ("invoice");



CREATE INDEX "stripe_payment_methods_customer_idx" ON "stripe"."payment_methods" USING "btree" ("customer");



CREATE INDEX "stripe_refunds_charge_idx" ON "stripe"."refunds" USING "btree" ("charge");



CREATE INDEX "stripe_refunds_payment_intent_idx" ON "stripe"."refunds" USING "btree" ("payment_intent");



CREATE INDEX "stripe_reviews_charge_idx" ON "stripe"."reviews" USING "btree" ("charge");



CREATE INDEX "stripe_reviews_payment_intent_idx" ON "stripe"."reviews" USING "btree" ("payment_intent");



CREATE INDEX "stripe_setup_intents_customer_idx" ON "stripe"."setup_intents" USING "btree" ("customer");



CREATE INDEX "stripe_tax_ids_customer_idx" ON "stripe"."tax_ids" USING "btree" ("customer");



CREATE OR REPLACE TRIGGER "activity_attendees_count" AFTER INSERT OR DELETE ON "public"."activity_attendees" FOR EACH ROW EXECUTE FUNCTION "public"."update_activity_attendee_count"();



CREATE OR REPLACE TRIGGER "content_likes_count" AFTER INSERT OR DELETE ON "public"."content_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_content_likes_count"();



CREATE OR REPLACE TRIGGER "dating_swipes_match_check" AFTER INSERT ON "public"."dating_swipes" FOR EACH ROW EXECUTE FUNCTION "public"."check_dating_match"();



CREATE OR REPLACE TRIGGER "follows_count" AFTER INSERT OR DELETE ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "public"."update_follower_counts"();



CREATE OR REPLACE TRIGGER "group_members_count" AFTER INSERT OR DELETE ON "public"."group_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_group_member_count"();



CREATE OR REPLACE TRIGGER "on_swipe_match" AFTER INSERT ON "public"."dating_swipes" FOR EACH ROW EXECUTE FUNCTION "public"."check_for_match"();



CREATE OR REPLACE TRIGGER "on_user_created_initialize_preferences" AFTER INSERT ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."initialize_user_preferences"();



CREATE OR REPLACE TRIGGER "user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."_managed_webhooks" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_metadata"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."_sync_obj_runs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_metadata"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."_sync_runs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at_metadata"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."active_entitlements" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."charges" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."checkout_session_line_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."checkout_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."coupons" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."disputes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."early_fraud_warnings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."exchange_rates_from_usd" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."features" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."payouts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."plans" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."prices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."refunds" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."subscription_item_change_events_v2_beta" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "stripe"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_sync_stripe_prices" AFTER INSERT OR UPDATE ON "stripe"."prices" FOR EACH ROW EXECUTE FUNCTION "public"."sync_stripe_price_to_plans"();



CREATE OR REPLACE TRIGGER "tr_sync_stripe_products" AFTER INSERT OR UPDATE ON "stripe"."products" FOR EACH ROW EXECUTE FUNCTION "public"."sync_stripe_product_to_plans"();



CREATE OR REPLACE TRIGGER "tr_sync_stripe_subscriptions" AFTER INSERT OR UPDATE ON "stripe"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."sync_stripe_subscription_to_user"();



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_asset_reward_fkey" FOREIGN KEY ("asset_reward") REFERENCES "public"."digital_assets"("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_attendees"
    ADD CONSTRAINT "activity_attendees_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_attendees"
    ADD CONSTRAINT "activity_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_messages"
    ADD CONSTRAINT "activity_messages_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_messages"
    ADD CONSTRAINT "activity_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ad_impressions"
    ADD CONSTRAINT "ad_impressions_ad_id_fkey" FOREIGN KEY ("ad_id") REFERENCES "public"."proximity_ads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ad_impressions"
    ADD CONSTRAINT "ad_impressions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_decisions"
    ADD CONSTRAINT "ai_decisions_feature_fkey" FOREIGN KEY ("feature") REFERENCES "public"."ai_config"("feature");



ALTER TABLE ONLY "public"."ai_decisions"
    ADD CONSTRAINT "ai_decisions_override_by_fkey" FOREIGN KEY ("override_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_ai_config_feature_fkey" FOREIGN KEY ("ai_config_feature") REFERENCES "public"."ai_config"("feature");



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blocks"
    ADD CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_bookings"
    ADD CONSTRAINT "business_bookings_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_bookings"
    ADD CONSTRAINT "business_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_reviews"
    ADD CONSTRAINT "business_reviews_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."business_reviews"
    ADD CONSTRAINT "business_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."businesses"
    ADD CONSTRAINT "businesses_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."content_comments"
    ADD CONSTRAINT "content_comments_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_comments"
    ADD CONSTRAINT "content_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."content_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_comments"
    ADD CONSTRAINT "content_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_likes"
    ADD CONSTRAINT "content_likes_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_likes"
    ADD CONSTRAINT "content_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_saves"
    ADD CONSTRAINT "content_saves_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_saves"
    ADD CONSTRAINT "content_saves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_views"
    ADD CONSTRAINT "content_views_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_views"
    ADD CONSTRAINT "content_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_last_message_id_fkey" FOREIGN KEY ("last_message_id") REFERENCES "public"."direct_messages"("id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crossed_paths"
    ADD CONSTRAINT "crossed_paths_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."crossed_paths"
    ADD CONSTRAINT "crossed_paths_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."custom_themes"
    ADD CONSTRAINT "custom_themes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."data_requests"
    ADD CONSTRAINT "data_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dating_matches"
    ADD CONSTRAINT "dating_matches_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dating_matches"
    ADD CONSTRAINT "dating_matches_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dating_messages"
    ADD CONSTRAINT "dating_messages_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."dating_matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dating_messages"
    ADD CONSTRAINT "dating_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dating_profiles"
    ADD CONSTRAINT "dating_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dating_swipes"
    ADD CONSTRAINT "dating_swipes_swiped_id_fkey" FOREIGN KEY ("swiped_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dating_swipes"
    ADD CONSTRAINT "dating_swipes_swiper_id_fkey" FOREIGN KEY ("swiper_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "direct_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "direct_messages_reply_to_fkey" FOREIGN KEY ("reply_to") REFERENCES "public"."direct_messages"("id");



ALTER TABLE ONLY "public"."direct_messages"
    ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_invitations"
    ADD CONSTRAINT "group_invitations_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_messages"
    ADD CONSTRAINT "group_messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_messages"
    ADD CONSTRAINT "group_messages_reply_to_fkey" FOREIGN KEY ("reply_to") REFERENCES "public"."group_messages"("id");



ALTER TABLE ONLY "public"."group_messages"
    ADD CONSTRAINT "group_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."leaderboard_entries"
    ADD CONSTRAINT "leaderboard_entries_leaderboard_id_fkey" FOREIGN KEY ("leaderboard_id") REFERENCES "public"."leaderboards"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leaderboard_entries"
    ADD CONSTRAINT "leaderboard_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."live_streams"
    ADD CONSTRAINT "live_streams_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."location_history"
    ADD CONSTRAINT "location_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."loneliness_detection"
    ADD CONSTRAINT "loneliness_detection_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."memory_capsules"
    ADD CONSTRAINT "memory_capsules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moment_drops"
    ADD CONSTRAINT "moment_drops_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."panic_events"
    ADD CONSTRAINT "panic_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."proximity_ads"
    ADD CONSTRAINT "proximity_ads_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_tokens"
    ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."random_chat_messages"
    ADD CONSTRAINT "random_chat_messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "public"."random_chats"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."random_chat_messages"
    ADD CONSTRAINT "random_chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."random_chat_queue"
    ADD CONSTRAINT "random_chat_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."random_chats"
    ADD CONSTRAINT "random_chats_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."random_chats"
    ADD CONSTRAINT "random_chats_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."random_connect_queue"
    ADD CONSTRAINT "random_connect_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."random_connections"
    ADD CONSTRAINT "random_connections_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."random_connections"
    ADD CONSTRAINT "random_connections_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."random_date_queue"
    ADD CONSTRAINT "random_date_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."social_signals"
    ADD CONSTRAINT "social_signals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stream_messages"
    ADD CONSTRAINT "stream_messages_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "public"."live_streams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stream_messages"
    ADD CONSTRAINT "stream_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."stream_participants"
    ADD CONSTRAINT "stream_participants_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "public"."live_streams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stream_participants"
    ADD CONSTRAINT "stream_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stream_viewers"
    ADD CONSTRAINT "stream_viewers_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "public"."live_streams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stream_viewers"
    ADD CONSTRAINT "stream_viewers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stripe_connect_accounts"
    ADD CONSTRAINT "stripe_connect_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_events"
    ADD CONSTRAINT "subscription_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_assets"
    ADD CONSTRAINT "user_assets_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."digital_assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_assets"
    ADD CONSTRAINT "user_assets_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id");



ALTER TABLE ONLY "public"."user_assets"
    ADD CONSTRAINT "user_assets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_identity"
    ADD CONSTRAINT "user_identity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_metrics"
    ADD CONSTRAINT "user_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_presence"
    ADD CONSTRAINT "user_presence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_social_roles"
    ADD CONSTRAINT "user_social_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallets"
    ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "stripe"."active_entitlements"
    ADD CONSTRAINT "fk_active_entitlements_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."charges"
    ADD CONSTRAINT "fk_charges_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."checkout_session_line_items"
    ADD CONSTRAINT "fk_checkout_session_line_items_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."checkout_sessions"
    ADD CONSTRAINT "fk_checkout_sessions_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."credit_notes"
    ADD CONSTRAINT "fk_credit_notes_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."customers"
    ADD CONSTRAINT "fk_customers_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."disputes"
    ADD CONSTRAINT "fk_disputes_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."early_fraud_warnings"
    ADD CONSTRAINT "fk_early_fraud_warnings_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."exchange_rates_from_usd"
    ADD CONSTRAINT "fk_exchange_rates_from_usd_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."features"
    ADD CONSTRAINT "fk_features_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."invoices"
    ADD CONSTRAINT "fk_invoices_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."_managed_webhooks"
    ADD CONSTRAINT "fk_managed_webhooks_account" FOREIGN KEY ("account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."payment_intents"
    ADD CONSTRAINT "fk_payment_intents_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."payment_methods"
    ADD CONSTRAINT "fk_payment_methods_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."plans"
    ADD CONSTRAINT "fk_plans_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."prices"
    ADD CONSTRAINT "fk_prices_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."products"
    ADD CONSTRAINT "fk_products_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."refunds"
    ADD CONSTRAINT "fk_refunds_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."reviews"
    ADD CONSTRAINT "fk_reviews_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."setup_intents"
    ADD CONSTRAINT "fk_setup_intents_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."subscription_item_change_events_v2_beta"
    ADD CONSTRAINT "fk_subscription_item_change_events_v2_beta_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."subscription_items"
    ADD CONSTRAINT "fk_subscription_items_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."subscription_schedules"
    ADD CONSTRAINT "fk_subscription_schedules_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."subscriptions"
    ADD CONSTRAINT "fk_subscriptions_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."_sync_obj_runs"
    ADD CONSTRAINT "fk_sync_obj_runs_parent" FOREIGN KEY ("_account_id", "run_started_at") REFERENCES "stripe"."_sync_runs"("_account_id", "started_at");



ALTER TABLE ONLY "stripe"."_sync_runs"
    ADD CONSTRAINT "fk_sync_run_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



ALTER TABLE ONLY "stripe"."tax_ids"
    ADD CONSTRAINT "fk_tax_ids_account" FOREIGN KEY ("_account_id") REFERENCES "stripe"."accounts"("id");



CREATE POLICY "Active daters can view other profiles" ON "public"."dating_profiles" FOR SELECT USING ((("is_active" = true) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Admins can update withdrawals" ON "public"."withdrawals" FOR UPDATE USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Admins can view all withdrawals" ON "public"."withdrawals" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Admins/Group Owners can create invitations" ON "public"."group_invitations" FOR INSERT WITH CHECK ((("auth"."uid"() = "inviter_id") AND (EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "group_invitations"."group_id") AND ("group_members"."user_id" = "auth"."uid"()) AND ("group_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



CREATE POLICY "Allow anonymous read access" ON "public"."platform_config" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow authenticated insert to user_roles" ON "public"."user_roles" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow public read access to user_metrics" ON "public"."user_metrics" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to user_presence" ON "public"."user_presence" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to user_roles" ON "public"."user_roles" FOR SELECT USING (true);



CREATE POLICY "Allow users to update own metrics" ON "public"."user_metrics" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Anyone can view follows" ON "public"."follows" FOR SELECT USING (true);



CREATE POLICY "Anyone see active challenges" ON "public"."city_challenges" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "Anyone see active moment drops" ON "public"."moment_drops" FOR SELECT TO "authenticated", "anon" USING ((("is_active" = true) AND ("end_time" > "now"())));



CREATE POLICY "Authenticated create activities" ON "public"."activities" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can create groups" ON "public"."groups" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can join queue" ON "public"."random_chat_queue" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can read queue" ON "public"."random_chat_queue" FOR SELECT USING (true);



CREATE POLICY "Creator manage activities" ON "public"."activities" USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Creators can update activities" ON "public"."activities" FOR UPDATE USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "Dating profiles visible to all authenticated" ON "public"."dating_profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable all access for authenticated users" ON "public"."user_presence" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."groups" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for all" ON "public"."groups" FOR SELECT USING (true);



CREATE POLICY "Enable update for creators" ON "public"."groups" FOR UPDATE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Group members are viewable by everyone" ON "public"."group_members" FOR SELECT USING (true);



CREATE POLICY "Hosts can manage own streams" ON "public"."live_streams" USING (("auth"."uid"() = "host_id"));



CREATE POLICY "Invitee can accept/decline" ON "public"."group_invitations" FOR UPDATE USING (("auth"."uid"() = "invitee_id"));



CREATE POLICY "Members can view group members" ON "public"."group_members" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "group_members"."group_id") AND ("gm"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."groups" "g"
  WHERE (("g"."id" = "group_members"."group_id") AND ("g"."is_public" = true))))));



CREATE POLICY "Members can view private groups" ON "public"."groups" FOR SELECT USING ((("privacy" = 'private'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "groups"."id") AND ("group_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Owners can update groups" ON "public"."groups" FOR UPDATE USING ((("creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "groups"."id") AND ("group_members"."user_id" = "auth"."uid"()) AND ("group_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"])))))));



CREATE POLICY "Owners/Admins can update groups" ON "public"."groups" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "groups"."id") AND ("group_members"."user_id" = "auth"."uid"()) AND ("group_members"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));



CREATE POLICY "Public groups are viewable by everyone" ON "public"."groups" FOR SELECT USING (("privacy" = 'public'::"text"));



CREATE POLICY "Public profiles are viewable by everyone" ON "public"."user_profiles" FOR SELECT USING (true);



CREATE POLICY "Public read active dating profiles" ON "public"."dating_profiles" FOR SELECT USING (true);



CREATE POLICY "Public read activities" ON "public"."activities" FOR SELECT USING (true);



CREATE POLICY "Public read subscription plans" ON "public"."subscription_plans" FOR SELECT USING (true);



CREATE POLICY "Public streams visible to authenticated users" ON "public"."live_streams" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND (("is_public" = true) OR ("host_id" = "auth"."uid"()))));



CREATE POLICY "Service role can insert subscription events" ON "public"."subscription_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role full access" ON "public"."user_profiles" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "System manages city energy" ON "public"."city_energy_states" TO "authenticated" WITH CHECK (true);



CREATE POLICY "User presence viewable by everyone" ON "public"."user_presence" FOR SELECT USING (true);



CREATE POLICY "Users can block" ON "public"."blocks" FOR INSERT WITH CHECK (("blocker_id" = "auth"."uid"()));



CREATE POLICY "Users can create activities" ON "public"."activities" FOR INSERT WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can create content" ON "public"."content" FOR INSERT WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can create groups" ON "public"."groups" FOR INSERT WITH CHECK (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can create swipes" ON "public"."dating_swipes" FOR INSERT WITH CHECK (("auth"."uid"() = "swiper_id"));



CREATE POLICY "Users can create withdrawals" ON "public"."withdrawals" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can follow" ON "public"."follows" FOR INSERT WITH CHECK (("follower_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own identity" ON "public"."user_identity" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own presence" ON "public"."user_presence" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can insert swipes" ON "public"."dating_swipes" FOR INSERT WITH CHECK (("auth"."uid"() = "swiper_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can join public groups" ON "public"."group_members" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") AND (EXISTS ( SELECT 1
   FROM "public"."groups"
  WHERE (("groups"."id" = "group_members"."group_id") AND ("groups"."privacy" = 'public'::"text"))))));



CREATE POLICY "Users can join streams" ON "public"."stream_participants" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can leave groups" ON "public"."group_members" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can leave streams" ON "public"."stream_participants" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own dating profile" ON "public"."dating_profiles" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own presence" ON "public"."user_presence" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own themes" ON "public"."custom_themes" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own tokens" ON "public"."push_tokens" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own matches" ON "public"."dating_matches" FOR SELECT USING ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id")));



CREATE POLICY "Users can read own swipes" ON "public"."dating_swipes" FOR SELECT USING (("auth"."uid"() = "swiper_id"));



CREATE POLICY "Users can remove themselves" ON "public"."random_chat_queue" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can see own matches" ON "public"."matches" FOR SELECT USING ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id")));



CREATE POLICY "Users can see own swipes" ON "public"."dating_swipes" FOR SELECT USING ((("auth"."uid"() = "swiper_id") OR ("auth"."uid"() = "swiped_id")));



CREATE POLICY "Users can see stream participants" ON "public"."stream_participants" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Users can see their invitations" ON "public"."group_invitations" FOR SELECT USING ((("auth"."uid"() = "inviter_id") OR ("auth"."uid"() = "invitee_id")));



CREATE POLICY "Users can send match messages" ON "public"."dating_messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."dating_matches"
  WHERE (("dating_matches"."id" = "dating_messages"."match_id") AND (("dating_matches"."user1_id" = "auth"."uid"()) OR ("dating_matches"."user2_id" = "auth"."uid"())) AND ("dating_matches"."status" = 'active'::"text"))))));



CREATE POLICY "Users can send messages" ON "public"."direct_messages" FOR INSERT WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can unblock" ON "public"."blocks" FOR DELETE USING (("blocker_id" = "auth"."uid"()));



CREATE POLICY "Users can unfollow" ON "public"."follows" FOR DELETE USING (("follower_id" = "auth"."uid"()));



CREATE POLICY "Users can update own content" ON "public"."content" FOR UPDATE USING (("creator_id" = "auth"."uid"()));



CREATE POLICY "Users can update own identity" ON "public"."user_identity" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own presence" ON "public"."user_presence" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view match messages" ON "public"."dating_messages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."dating_matches"
  WHERE (("dating_matches"."id" = "dating_messages"."match_id") AND (("dating_matches"."user1_id" = "auth"."uid"()) OR ("dating_matches"."user2_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view own blocks" ON "public"."blocks" FOR SELECT USING (("blocker_id" = "auth"."uid"()));



CREATE POLICY "Users can view own identity" ON "public"."user_identity" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own matches" ON "public"."dating_matches" FOR SELECT USING ((("user1_id" = "auth"."uid"()) OR ("user2_id" = "auth"."uid"())));



CREATE POLICY "Users can view own messages" ON "public"."direct_messages" FOR SELECT USING (((("sender_id" = "auth"."uid"()) AND (NOT "is_deleted_sender")) OR (("recipient_id" = "auth"."uid"()) AND (NOT "is_deleted_recipient"))));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own payments" ON "public"."payments" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own subscriptions" ON "public"."user_subscriptions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own themes" ON "public"."custom_themes" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("is_public" = true)));



CREATE POLICY "Users can view own transactions" ON "public"."transactions" FOR SELECT USING (("wallet_id" IN ( SELECT "wallets"."id"
   FROM "public"."wallets"
  WHERE ("wallets"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view own wallet" ON "public"."wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own withdrawals" ON "public"."withdrawals" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view public activities" ON "public"."activities" FOR SELECT USING ((("is_public" = true) OR ("creator_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."activity_attendees"
  WHERE (("activity_attendees"."activity_id" = "activities"."id") AND ("activity_attendees"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view public content" ON "public"."content" FOR SELECT USING (((("visibility" = 'public'::"text") AND ("moderation_status" = 'approved'::"public"."moderation_status") AND (NOT "is_deleted")) OR ("creator_id" = "auth"."uid"())));



CREATE POLICY "Users can view public groups" ON "public"."groups" FOR SELECT USING ((("is_public" = true) OR (EXISTS ( SELECT 1
   FROM "public"."group_members"
  WHERE (("group_members"."group_id" = "groups"."id") AND ("group_members"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Users can view public profiles" ON "public"."user_profiles" FOR SELECT USING (((NOT "banned") AND (((("privacy_settings" ->> 'profile_visible'::"text"))::boolean = true) OR ("id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own subscription events" ON "public"."subscription_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view visible presence" ON "public"."user_presence" FOR SELECT USING (((("is_visible" = true) AND ("availability" <> 'invisible'::"public"."user_availability")) OR ("user_id" = "auth"."uid"())));



CREATE POLICY "Users manage own capsules" ON "public"."memory_capsules" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own loneliness" ON "public"."loneliness_detection" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own roles" ON "public"."user_social_roles" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own signals" ON "public"."social_signals" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users read own subscription" ON "public"."user_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_attendees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."business_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."businesses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."city_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."city_energy_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_saves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."crossed_paths" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."custom_themes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dating_matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dating_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dating_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dating_swipes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."direct_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."live_streams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."location_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."loneliness_detection" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."memory_capsules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moment_drops" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."platform_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."proximity_ads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."random_chat_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."random_chats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."random_connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."social_signals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stream_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stream_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stream_viewers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_consents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_identity" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_presence" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_social_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."withdrawals" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."dating_swipes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."group_messages";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."live_streams";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_presence";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_profiles";









REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO PUBLIC;
GRANT ALL ON SCHEMA "public" TO "service_role";
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";














































































































































































GRANT ALL ON FUNCTION "public"."find_best_matches"("p_latitude" double precision, "p_longitude" double precision, "p_radius_meters" double precision, "p_limit" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."find_nearby_activities"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."find_nearby_assets"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."find_nearby_drops"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."find_nearby_groups"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."find_nearby_users"("p_lat" double precision, "p_lng" double precision, "p_radius_meters" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_active_streams_on_map"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."increment_stream_viewers"("stream_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."update_user_location"("lat" double precision, "lng" double precision) TO "authenticated";



GRANT ALL ON FUNCTION "public"."update_user_subscription"("p_user_id" "uuid", "p_stripe_customer_id" "text", "p_stripe_subscription_id" "text", "p_tier" "text", "p_status" "text", "p_start" timestamp with time zone, "p_end" timestamp with time zone) TO "service_role";
























GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."activities" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."activities" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."custom_themes" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dating_matches" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dating_matches" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dating_profiles" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dating_profiles" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dating_swipes" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dating_swipes" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."groups" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."groups" TO "authenticated";



GRANT SELECT ON TABLE "public"."platform_config" TO "anon";
GRANT SELECT ON TABLE "public"."platform_config" TO "authenticated";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."random_chat_queue" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."random_chat_queue" TO "authenticated";



GRANT SELECT ON TABLE "public"."subscription_events" TO "authenticated";
GRANT INSERT ON TABLE "public"."subscription_events" TO "service_role";



GRANT SELECT ON TABLE "public"."subscription_plans" TO "anon";
GRANT SELECT ON TABLE "public"."subscription_plans" TO "authenticated";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."user_identity" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_metrics" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_metrics" TO "authenticated";



GRANT SELECT,INSERT,UPDATE ON TABLE "public"."user_preferences" TO "authenticated";



GRANT ALL ON TABLE "public"."user_presence" TO "anon";
GRANT ALL ON TABLE "public"."user_presence" TO "authenticated";
GRANT ALL ON TABLE "public"."user_presence" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_roles" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_roles" TO "authenticated";



GRANT SELECT ON TABLE "public"."user_subscriptions" TO "anon";
GRANT SELECT ON TABLE "public"."user_subscriptions" TO "authenticated";


































