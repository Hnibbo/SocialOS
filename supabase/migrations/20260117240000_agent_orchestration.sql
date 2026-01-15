-- SOCIAL OS: AUTONOMOUS AGENT ORCHESTRATION
-- Real-time background operations for neural nodes

-- 1. Track background execution sessions
CREATE TABLE IF NOT EXISTS public.agent_missions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    agent_id uuid REFERENCES public.marketplace_agents(id) ON DELETE CASCADE,
    
    status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    mission_type text DEFAULT 'background_scan',
    
    result_data jsonb DEFAULT '{}'::jsonb,
    error_message text,
    
    run_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);

-- 2. Function to fetch background targets
CREATE OR REPLACE FUNCTION public.get_agent_mission_targets()
RETURNS TABLE (
    user_id uuid,
    agent_id uuid,
    agent_slug text,
    custom_config jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uia.user_id,
        uia.agent_id,
        ma.slug,
        uia.custom_config
    FROM public.user_installed_agents uia
    JOIN public.marketplace_agents ma ON uia.agent_id = ma.id
    WHERE uia.is_enabled = true
    AND (uia.last_run_at IS NULL OR uia.last_run_at < now() - interval '4 hours')
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Proactive Matchmaking for the 'Networker' Agent
CREATE OR REPLACE FUNCTION public.execute_networker_mission(p_user_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_match_id uuid;
    v_target_profile record;
BEGIN
    -- Use existing neural matching to find a candidate
    SELECT * INTO v_target_profile
    FROM public.find_neural_matches('professional', 1)
    WHERE id != p_user_id
    LIMIT 1;

    IF v_target_profile IS NOT NULL THEN
        -- Create a pro match suggestion
        INSERT INTO public.pro_matches (user_one, user_two, status, intent_type)
        VALUES (p_user_id, v_target_profile.id, 'pending', 'collaboration')
        ON CONFLICT (user_one, user_two) DO NOTHING
        RETURNING id INTO v_match_id;

        RETURN jsonb_build_object(
            'status', 'match_created',
            'target_name', v_target_profile.display_name,
            'match_id', v_match_id
        );
    END IF;

    RETURN jsonb_build_object('status', 'no_matches_found');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT ALL ON public.agent_missions TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agent_mission_targets TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_networker_mission TO service_role;
