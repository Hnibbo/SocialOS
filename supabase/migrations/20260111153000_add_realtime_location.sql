-- Real-time Location Support
-- 1. Enable PostGIS for geospatial queries (if not enabled)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Add location column to user_presence
ALTER TABLE public.user_presence 
ADD COLUMN IF NOT EXISTS last_known_location GEOMETRY(POINT, 4326);

ALTER TABLE public.user_presence 
ADD COLUMN IF NOT EXISTS last_location_updated_at TIMESTAMP WITH TIME ZONE;

-- 3. Create index for fast spatial queries
CREATE INDEX IF NOT EXISTS user_presence_location_idx 
ON public.user_presence USING GIST (last_known_location);

-- 4. Update Policies (ensure users can update their own location)
-- (We already have a permissive "Enable all access" policy, so this is covered, 
-- but let's double check RLS is permissive enough for the update)

-- 5. Function to update location (easier to call from client)
CREATE OR REPLACE FUNCTION public.update_user_location(lat FLOAT, lng FLOAT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_presence (user_id, last_known_location, last_location_updated_at, online_at)
  VALUES (
    auth.uid(),
    ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    last_known_location = ST_SetSRID(ST_MakePoint(lng, lat), 4326),
    last_location_updated_at = NOW(),
    online_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
