-- Migration: Security & Performance Fixes
-- Addresses Supabase advisor warnings

-- 1. Fix Security Definer View (ERROR level)
-- The 'profiles' view should not use SECURITY DEFINER
DROP VIEW IF EXISTS public.profiles;

CREATE VIEW public.profiles AS
SELECT 
    id,
    username,
    full_name,
    avatar_url,
    website,
    updated_at
FROM public.user_profiles;

-- Grant access
GRANT SELECT ON public.profiles TO authenticated, anon;

-- 2. Add missing indexes for foreign keys (Performance)
-- These improve query performance for joins
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_sessions') THEN
        CREATE INDEX IF NOT EXISTS idx_agent_sessions_workspace_id ON public.agent_sessions(workspace_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_logs') THEN
        CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'commands') THEN
        CREATE INDEX IF NOT EXISTS idx_commands_created_by ON public.commands(created_by);
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'dating_swipes') THEN
        CREATE INDEX IF NOT EXISTS idx_dating_swipes_swiper_id ON public.dating_swipes(swiper_id);
        CREATE INDEX IF NOT EXISTS idx_dating_swipes_swiped_id ON public.dating_swipes(swiped_id);
    END IF;
END $$;

-- 3. Fix function search paths (Security)
-- Update functions to have explicit search_path
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'purchase_agent') THEN
        ALTER FUNCTION public.purchase_agent SET search_path = public, extensions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'request_withdrawal') THEN
        ALTER FUNCTION public.request_withdrawal SET search_path = public, extensions;
    END IF;
END $$;
