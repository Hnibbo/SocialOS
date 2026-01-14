-- Fix User Presence / Activities Schema Mismatches
-- 1. Ensure user_presence has columns expected by RPC and Frontend
ALTER TABLE public.user_presence ADD COLUMN IF NOT EXISTS online_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.user_presence ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.user_presence ADD COLUMN IF NOT EXISTS last_location_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.user_presence ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE; -- Keep legacy if widely used

-- 2. Update RPC to be robust
CREATE OR REPLACE FUNCTION public.update_user_location(lat FLOAT, lng FLOAT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_presence (
        user_id, 
        last_known_location, 
        last_location_updated_at, 
        online_at, 
        updated_at,
        last_seen
  )
  VALUES (
    auth.uid(),
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    NOW(),
    NOW(),
    NOW(),
    NOW()
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

-- 3. Fix Activities Table (just in case)
-- Ensure 'expires_at' and 'location' are definitely there (idempotent)
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS location GEOMETRY(POINT, 4326);

-- 4. Fix Permissions for user_presence
GRANT ALL ON public.user_presence TO authenticated;
GRANT SELECT ON public.user_presence TO anon;
