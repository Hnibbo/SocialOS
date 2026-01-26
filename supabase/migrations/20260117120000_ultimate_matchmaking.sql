-- ULTIMATE IDENTITY EXTENSIONS
-- Adding support for professional networking and deep matchmaking

-- 1. Extend user_identity for professional data
ALTER TABLE public.user_identity 
ADD COLUMN IF NOT EXISTS career_role text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS learning_goals text[],
ADD COLUMN IF NOT EXISTS education text,
ADD COLUMN IF NOT EXISTS portfolio_url text,
ADD COLUMN IF NOT EXISTS open_to_mentoring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS looking_for_mentor boolean DEFAULT false;

-- 2. Professional Connections (Matches)
CREATE TABLE IF NOT EXISTS public.pro_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_one uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    user_two uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    status text DEFAULT 'pending', -- 'pending', 'accepted', 'ignored'
    shared_skills text[],
    intent_type text NOT NULL, -- 'collaboration', 'hiring', 'referral', 'learning'
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_one, user_two)
);

-- 3. Identity Matching Metadata
CREATE TABLE IF NOT EXISTS public.match_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE UNIQUE,
    preferred_genders text[],
    preferred_age_range int4range,
    preferred_distance_km integer DEFAULT 50,
    preferred_professional_skills text[],
    is_dating_active boolean DEFAULT true,
    is_networking_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.pro_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_preferences ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Users can manage their own pro matches"
ON public.pro_matches FOR ALL
USING (auth.uid() = user_one OR auth.uid() = user_two);

CREATE POLICY "Users can manage their own match preferences"
ON public.match_preferences FOR ALL
USING (auth.uid() = user_id);

-- 6. RPC: Find Neural Matches
CREATE OR REPLACE FUNCTION public.find_neural_matches(
    p_match_type text, -- 'romantic' or 'professional'
    p_limit integer DEFAULT 20
)
RETURNS SETOF public.user_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_match_type = 'romantic' THEN
        RETURN QUERY
        SELECT up.*
        FROM public.user_profiles up
        JOIN public.user_identity ui ON up.id = ui.user_id
        JOIN public.match_preferences pref ON pref.user_id = auth.uid()
        WHERE up.id != auth.uid()
        AND up.intent_signal IN ('dating', 'hang', 'party')
        -- Add complex matching logic here in phase 2
        LIMIT p_limit;
    ELSIF p_match_type = 'professional' THEN
        RETURN QUERY
        SELECT up.*
        FROM public.user_profiles up
        JOIN public.user_identity ui ON up.id = ui.user_id
        WHERE up.id != auth.uid()
        AND up.intent_signal IN ('work', 'chat')
        -- Skill overlap logic
        LIMIT p_limit;
    ELSE
        RETURN QUERY SELECT * FROM public.user_profiles WHERE id != auth.uid() LIMIT p_limit;
    END IF;
END;
$$;

-- Grants
GRANT ALL ON public.pro_matches TO authenticated;
GRANT ALL ON public.match_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_neural_matches TO authenticated;
