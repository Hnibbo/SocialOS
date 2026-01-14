-- Migration: Live Streaming Infrastructure

-- 1. Live Streams Table
CREATE TABLE IF NOT EXISTS public.live_streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    host_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    room_name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT TRUE,
    max_participants INTEGER DEFAULT 50,
    viewer_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMP WITH TIME ZONE,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    location GEOGRAPHY(POINT),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist (in case table was created with fewer columns)
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 50;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS viewer_count INTEGER DEFAULT 0;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT);
ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. Stream Participants (for tracking who's in a stream)
CREATE TABLE IF NOT EXISTS public.stream_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID REFERENCES public.live_streams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('host', 'moderator', 'viewer')) DEFAULT 'viewer',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(stream_id, user_id)
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_host_id ON public.live_streams(host_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_is_active ON public.live_streams(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_live_streams_location ON public.live_streams USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_stream_participants_stream_id ON public.stream_participants(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_participants_user_id ON public.stream_participants(user_id);

-- 4. RLS Policies
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_participants ENABLE ROW LEVEL SECURITY;

-- Public streams visible to all
DROP POLICY IF EXISTS "Public streams visible to authenticated users" ON public.live_streams;
CREATE POLICY "Public streams visible to authenticated users"
    ON public.live_streams FOR SELECT
    USING (auth.role() = 'authenticated' AND (is_public = true OR host_id = auth.uid()));

-- Hosts can manage their own streams
DROP POLICY IF EXISTS "Hosts can manage own streams" ON public.live_streams;
CREATE POLICY "Hosts can manage own streams"
    ON public.live_streams FOR ALL
    USING (auth.uid() = host_id);

-- Participants can see their participation
DROP POLICY IF EXISTS "Users can see stream participants" ON public.stream_participants;
CREATE POLICY "Users can see stream participants"
    ON public.stream_participants FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users can join streams
DROP POLICY IF EXISTS "Users can join streams" ON public.stream_participants;
CREATE POLICY "Users can join streams"
    ON public.stream_participants FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can leave streams
DROP POLICY IF EXISTS "Users can leave streams" ON public.stream_participants;
CREATE POLICY "Users can leave streams"
    ON public.stream_participants FOR UPDATE
    USING (auth.uid() = user_id);
