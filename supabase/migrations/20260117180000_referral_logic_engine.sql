-- SOCIAL OS: REFERRAL LOGIC ENGINE
-- Automated processing of invitations and reward fulfillment

-- 1. Function to process a new sign up via referral
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
BEGIN
    -- 1. Find the referrer by code
    SELECT id INTO v_referrer_id FROM public.user_profiles WHERE referral_code = p_referral_code;
    
    IF v_referrer_id IS NULL THEN
        RETURN false;
    END IF;

    -- 2. Prevent self-referral
    IF v_referrer_id = p_new_user_id THEN
        RETURN false;
    END IF;

    -- 3. Check if referral record already exists for this email/user
    -- We UPSERT or check for existing pending record
    IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = p_new_user_id) THEN
        RETURN false;
    END IF;

    -- 4. Track the conversion (with location for Viral Heatmap)
    INSERT INTO public.referrals (
        referrer_id, 
        referral_code, 
        referred_user_id, 
        referred_email, -- We might not have it yet from the record, so we grab from user_profiles
        status, 
        location
    )
    SELECT 
        v_referrer_id, 
        p_referral_code, 
        p_new_user_id, 
        u.email, 
        'signed_up',
        CASE WHEN p_lat IS NOT NULL AND p_lng IS NOT NULL 
             THEN ST_SetSRID(ST_Point(p_lng, p_lat), 4326)::geography 
             ELSE NULL END
    FROM public.user_profiles u
    WHERE u.id = p_new_user_id
    ON CONFLICT (referral_code, referred_email) DO UPDATE 
    SET 
        referred_user_id = EXCLUDED.referred_user_id,
        status = 'signed_up',
        location = EXCLUDED.location,
        converted_at = now();

    RETURN true;
END;
$$;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION public.process_referral_sign_up TO authenticated;
