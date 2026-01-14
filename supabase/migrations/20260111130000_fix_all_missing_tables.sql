-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT CHECK (role IN ('admin', 'moderator', 'user')) DEFAULT 'user',
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_metrics table
CREATE TABLE IF NOT EXISTS public.user_metrics (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    posts_count INTEGER DEFAULT 0,
    hup_score INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_presence table
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    status TEXT CHECK (status IN ('online', 'offline', 'away')) DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    current_activity TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    member_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anon and authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_metrics TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_presence TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO anon, authenticated;

-- Create basic policies (permissive for development)
-- User Roles
CREATE POLICY "Allow public read access to user_roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert to user_roles" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User Metrics
CREATE POLICY "Allow public read access to user_metrics" ON public.user_metrics FOR SELECT USING (true);
CREATE POLICY "Allow users to update own metrics" ON public.user_metrics FOR UPDATE USING (auth.uid() = user_id);

-- User Presence
CREATE POLICY "Allow public read access to user_presence" ON public.user_presence FOR SELECT USING (true);
CREATE POLICY "Allow users to update own presence" ON public.user_presence FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Allow users to insert own presence" ON public.user_presence FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Groups
CREATE POLICY "Allow public read access to groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Allow authenticated create groups" ON public.groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
