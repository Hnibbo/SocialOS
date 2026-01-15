-- SOCIAL OS: AUTONOMOUS AGENT ECONOMY
-- Automated XP deduction and installation logic

-- 1. Function to handle XP deduction on installation
CREATE OR REPLACE FUNCTION public.handle_agent_installation()
RETURNS TRIGGER AS $$
DECLARE
    v_price_xp integer;
    v_user_xp integer;
BEGIN
    -- Get the price of the agent
    SELECT price_xp INTO v_price_xp 
    FROM public.marketplace_agents 
    WHERE id = NEW.agent_id;

    -- Get user's current XP
    SELECT xp_points INTO v_user_xp 
    FROM public.user_profiles 
    WHERE id = NEW.user_id;

    -- Validate balance
    IF v_user_xp < v_price_xp THEN
        RAISE EXCEPTION 'Insufficient XP. Required: %, Available: %', v_price_xp, v_user_xp;
    END IF;

    -- Deduct XP from user profile
    UPDATE public.user_profiles 
    SET 
        xp_points = xp_points - v_price_xp,
        updated_at = now()
    WHERE id = NEW.user_id;

    -- Log the transaction in audit logs (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        INSERT INTO public.audit_logs (user_id, action, target_type, target_id, metadata)
        VALUES (NEW.user_id, 'install_agent', 'marketplace_agent', NEW.agent_id, jsonb_build_object('price_xp', v_price_xp));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger for agent installation
DROP TRIGGER IF EXISTS on_agent_installation ON public.user_installed_agents;
CREATE TRIGGER on_agent_installation
    BEFORE INSERT ON public.user_installed_agents
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_agent_installation();

-- 3. Enhance Agent Traces with better indexing
CREATE INDEX IF NOT EXISTS idx_agent_traces_user_id ON public.agent_traces(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_traces_created_at ON public.agent_traces(created_at DESC);
