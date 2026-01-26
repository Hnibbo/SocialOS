-- SOCIAL OS: NEURAL VIRAL PULSE ACTIVATION
-- Final spatial data layer reconciliation

-- 1. Referral Schema Update
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='location') THEN
        ALTER TABLE public.referrals ADD COLUMN location geography(POINT);
    END IF;
END $$;

-- 2. Moment Drops Schema Fix
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='moment_drops' AND column_name='location_coords') THEN
        ALTER TABLE public.moment_drops ADD COLUMN location_coords jsonb;
    END IF;
END $$;

-- 3. Viral Pulse View (Optimized for Heatmaps)
CREATE OR REPLACE VIEW public.viral_pulse_data AS
SELECT 
    ST_X(location::geometry) as lng,
    ST_Y(location::geometry) as lat,
    1.0 as weight,
    created_at
FROM public.referrals
WHERE location IS NOT NULL
AND created_at > now() - interval '30 days';

-- 4. Polished RLS for Growth Engine
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Admins manage rewards" ON public.referral_rewards;
    CREATE POLICY "Admins manage rewards" ON public.referral_rewards FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

    DROP POLICY IF EXISTS "Anyone view active rewards" ON public.referral_rewards;
    CREATE POLICY "Anyone view active rewards" ON public.referral_rewards FOR SELECT USING (is_active);

    DROP POLICY IF EXISTS "Users view own referrals" ON public.referrals;
    CREATE POLICY "Users view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

    DROP POLICY IF EXISTS "Admins view all" ON public.referrals;
    CREATE POLICY "Admins view all" ON public.referrals FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );
END $$;

-- 5. Collect Moment Drop RPC
CREATE OR REPLACE FUNCTION public.collect_moment_drop(p_drop_id uuid, p_lat numeric, p_lng numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_drop public.moment_drops;
    v_dist float;
    v_drop_lat float;
    v_drop_lng float;
BEGIN
    SELECT * INTO v_drop FROM public.moment_drops WHERE id = p_drop_id AND is_active = true;
    
    IF v_drop.id IS NULL THEN
        RAISE EXCEPTION 'Drop not active or not found.';
    END IF;

    IF v_drop.location_coords IS NOT NULL THEN
        v_drop_lat := (v_drop.location_coords->>'lat')::float;
        v_drop_lng := (v_drop.location_coords->>'lng')::float;
    ELSE
        v_drop_lat := v_drop.location_lat;
        v_drop_lng := v_drop.location_lng;
    END IF;

    v_dist := ST_Distance(
        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
        ST_SetSRID(ST_MakePoint(v_drop_lng, v_drop_lat), 4326)::geography
    );
    
    IF v_dist > COALESCE(v_drop.radius_meters, 500) THEN
        RAISE EXCEPTION 'You are too far from the drop location.';
    END IF;

    RETURN true;
END;
$$;

-- 6. Grants
GRANT SELECT ON public.viral_pulse_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.collect_moment_drop TO authenticated;

-- Seeds for Heatmap Pulse
INSERT INTO public.referrals (referral_code, referred_email, referrer_id, location, status)
SELECT 'BERLIN_GEN', 'guest@hup.ai', id, ST_SetSRID(ST_Point(13.413, 52.521), 4326)::geography, 'converted'
FROM public.user_profiles LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.referrals (referral_code, referred_email, referrer_id, location, status)
SELECT 'LDN_GEN', 'guest2@hup.ai', id, ST_SetSRID(ST_Point(-0.127, 51.507), 4326)::geography, 'converted'
FROM public.user_profiles LIMIT 1
ON CONFLICT DO NOTHING;
