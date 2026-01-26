-- SOCIAL OS: AGENT RUNTIME HELPERS
-- Tracking autonomous agent executions and metrics

-- 1. RPC to increment run count and update last_run timestamp
CREATE OR REPLACE FUNCTION public.increment_agent_runs(p_user_id uuid, p_agent_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.user_installed_agents
    SET 
        total_runs = COALESCE(total_runs, 0) + 1,
        last_run_at = now()
    WHERE user_id = p_user_id AND agent_id = p_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION public.increment_agent_runs TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_agent_runs TO service_role;
