-- Migration to create Dating Ecosystem Tables

-- 1. Dating Profiles
-- Stores dating-specific info, linked to user base profile
CREATE TABLE IF NOT EXISTS public.dating_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    photos TEXT[] DEFAULT '{}',
    bio TEXT,
    interests TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{"min_age": 18, "max_age": 50, "distance_km": 50, "gender": "all"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Dating Swipes
-- Tracks user interactions (likes, passes)
CREATE TABLE IF NOT EXISTS public.dating_swipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    swiper_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    swiped_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    direction TEXT CHECK (direction IN ('left', 'right', 'super')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(swiper_id, swiped_id)
);

-- 3. RLS Policies
ALTER TABLE public.dating_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_swipes ENABLE ROW LEVEL SECURITY;

-- Profiles are visible to everyone (for now, can be restricted by distance later)
DROP POLICY IF EXISTS "Dating profiles visible to all authenticated" ON public.dating_profiles;
CREATE POLICY "Dating profiles visible to all authenticated"
    ON public.dating_profiles FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users can manage their own profile
DROP POLICY IF EXISTS "Users can manage own dating profile" ON public.dating_profiles;
CREATE POLICY "Users can manage own dating profile"
    ON public.dating_profiles FOR ALL
    USING (auth.uid() = user_id);

-- Swipes: Users can only see their own swipes or swipes where they are the target (for matches)
DROP POLICY IF EXISTS "Users can see own swipes" ON public.dating_swipes;
CREATE POLICY "Users can see own swipes"
    ON public.dating_swipes FOR SELECT
    USING (auth.uid() = swiper_id OR auth.uid() = swiped_id);

DROP POLICY IF EXISTS "Users can create swipes" ON public.dating_swipes;
CREATE POLICY "Users can create swipes"
    ON public.dating_swipes FOR INSERT
    WITH CHECK (auth.uid() = swiper_id);
