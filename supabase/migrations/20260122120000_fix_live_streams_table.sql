-- Fix live_streams table schema to add missing room_name column
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS room_name TEXT;

-- Update existing records with room_name based on webrtc_room_id
UPDATE public.live_streams 
SET room_name = webrtc_room_id 
WHERE room_name IS NULL AND webrtc_room_id IS NOT NULL;

-- Add unique constraint to room_name
ALTER TABLE public.live_streams ADD CONSTRAINT live_streams_room_name_key UNIQUE(room_name);

-- Add RLS policy for live_streams table
DROP POLICY IF EXISTS "Public can view active streams" ON public.live_streams;
CREATE POLICY "Public can view active streams"
    ON public.live_streams FOR SELECT
    USING (is_active = true AND is_public = true);

DROP POLICY IF EXISTS "Host can manage their streams" ON public.live_streams;
CREATE POLICY "Host can manage their streams"
    ON public.live_streams FOR ALL
    USING (auth.uid() = host_id);
