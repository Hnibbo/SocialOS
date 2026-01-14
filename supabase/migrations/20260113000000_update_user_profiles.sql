-- Migration: Schema Polish for API Tokens and Location

-- 1. Ensure 'profiles' has api_token (conditional for views)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS api_token TEXT UNIQUE;
    END IF;
END $$;

-- 2. Update 'user_profiles' view to include api_token and location
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.website,
    p.updated_at,
    p.api_token,
    ST_Y(up.last_known_location::geometry) as location_lat,
    ST_X(up.last_known_location::geometry) as location_lng
FROM public.profiles p
LEFT JOIN public.user_presence up ON p.id = up.user_id;

-- 3. Grant permissions
GRANT SELECT ON public.user_profiles TO anon, authenticated;

-- 4. Create RPC to regenerate token (if needed by AdminSecurity/Settings)
DROP FUNCTION IF EXISTS public.regenerate_api_token(UUID);

CREATE OR REPLACE FUNCTION public.regenerate_api_token(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_token TEXT;
BEGIN
    -- Check permissions (only self or admin)
    IF auth.uid() != p_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    new_token := encode(gen_random_bytes(32), 'hex');
    
    UPDATE public.profiles 
    SET api_token = new_token 
    WHERE id = p_user_id;
    
    RETURN new_token;
END;
$$;

-- 5. Grant execute on the function
GRANT EXECUTE ON FUNCTION public.regenerate_api_token(UUID) TO authenticated;
