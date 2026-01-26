-- Fix Activities Table (Ensure all real columns exist)
-- 1. Create table if it doesn't exist (basic shell)
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add columns idempotently
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS activity_type TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS location GEOMETRY(POINT, 4326);
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 3. Indexes (Drop first to avoid duplication errors if basic ones exist)
DROP INDEX IF EXISTS activities_location_idx;
DROP INDEX IF EXISTS activities_expires_at_idx;

CREATE INDEX IF NOT EXISTS activities_location_idx ON public.activities USING GIST (location);
CREATE INDEX IF NOT EXISTS activities_expires_at_idx ON public.activities (expires_at);

-- 4. Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Drop first)
DROP POLICY IF EXISTS "Public read activities" ON public.activities;
DROP POLICY IF EXISTS "Authenticated create activities" ON public.activities;
DROP POLICY IF EXISTS "Creator manage activities" ON public.activities;

CREATE POLICY "Public read activities" ON public.activities
    FOR SELECT USING (true);

CREATE POLICY "Authenticated create activities" ON public.activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creator manage activities" ON public.activities
    FOR ALL USING (auth.uid() = creator_id);

-- 6. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO anon, authenticated;
