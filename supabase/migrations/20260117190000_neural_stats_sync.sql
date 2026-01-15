-- SOCIAL OS: NEURAL STATS & REFERRAL REWARDS
-- Persistent tracking of Energy, XP, and Level with reward fulfillment

-- 1. Add/Update Columns in user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS energy integer DEFAULT 100;

-- 2. Enhanced Referral RPC with Reward Fulfillment
CREATE OR REPLACE FUNCTION public.process_referral_sign_up(
    p_new_user_id uuid,
    p_referral_code text,
    p_lat double precision DEFAULT NULL,
    p_lng double precision DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_referrer_id uuid;
    v_referred_email text;
BEGIN
    -- 1. Find the referrer by code
    SELECT id INTO v_referrer_id FROM public.user_profiles WHERE referral_code = p_referral_code;
    
    IF v_referrer_id IS NULL OR v_referrer_id = p_new_user_id THEN
        RETURN false;
    END IF;

    -- 2. Check if referral record already exists for this user
    IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = p_new_user_id) THEN
        RETURN false;
    END IF;

    -- 3. Get referred user email
    SELECT email INTO v_referred_email FROM public.user_profiles WHERE id = p_new_user_id;

    -- 4. Track the conversion (with location for Viral Heatmap)
    INSERT INTO public.referrals (
        referrer_id, 
        referral_code, 
        referred_user_id, 
        referred_email,
        status, 
        location
    )
    VALUES (
        v_referrer_id, 
        p_referral_code, 
        p_new_user_id, 
        v_referred_email,
        'signed_up',
        CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL 
             THEN ST_SetSRID(ST_Point(p_lng, p_lat), 4326)::geography 
             ELSE NULL END
    )
    ON CONFLICT (referral_code, referred_email) DO UPDATE 
    SET 
        referred_user_id = EXCLUDED.referred_user_id,
        status = 'signed_up',
        location = EXCLUDED.location,
        converted_at = now();

    -- 5. AWARD REWARDS (Neural Injection)
    -- Award Referrer: +100 XP and +20 Energy
    UPDATE public.user_profiles 
    SET 
        xp_points = COALESCE(xp_points, 0) + 100,
        energy = LEAST(100, COALESCE(energy, 100) + 20)
    WHERE id = v_referrer_id;

    -- Award New User: +50 XP and +10 Energy
    UPDATE public.user_profiles 
    SET 
        xp_points = COALESCE(xp_points, 0) + 50,
        energy = LEAST(100, COALESCE(energy, 100) + 10)
    WHERE id = p_new_user_id;

    RETURN true;
END;
$$;

-- 3. Function to sync stats from DB to presence/context indirectly
-- (Actually the frontend will just poll or fetch on change)

-- 4. Automatically Level Up users based on XP
CREATE OR REPLACE FUNCTION public.handle_user_xp_level_up()
RETURNS trigger AS $$
DECLARE
    v_new_level integer;
BEGIN
    -- Basic Level Logic: Level = floor(xp / 1000) + 1
    v_new_level := FLOOR(NEW.xp_points / 1000) + 1;
    
    IF v_new_level > COALESCE(OLD.level, 1) THEN
        NEW.level := v_new_level;
        -- Future: Trigger 'level_up' achievement
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_user_level_up ON public.user_profiles;
CREATE TRIGGER tr_user_level_up
    BEFORE UPDATE OF xp_points ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_xp_level_up();
