-- SOCIAL OS: NEURAL SCHEMA EVOLUTION
-- Refining existing tables for advanced oversight

-- 1. Extend ai_config if needed
INSERT INTO public.ai_config (feature, display_name, system_prompt, model, enabled)
VALUES (
    'support_bot', 
    'Neural Assistant',
    'You are Hup AI, the official social assistant. You help users find events, understand levels, and connect with people. Be brief, futuristic, and helpful.',
    'anthropic/claude-3.5-sonnet',
    true
) ON CONFLICT (feature) DO UPDATE 
SET system_prompt = EXCLUDED.system_prompt;

-- 2. Enhance ai_decisions for full logging
ALTER TABLE public.ai_decisions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL;
ALTER TABLE public.ai_decisions ADD COLUMN IF NOT EXISTS prompt_raw text;
ALTER TABLE public.ai_decisions ADD COLUMN IF NOT EXISTS response_raw text;
ALTER TABLE public.ai_decisions ADD COLUMN IF NOT EXISTS tokens_input integer;
ALTER TABLE public.ai_decisions ADD COLUMN IF NOT EXISTS tokens_output integer;
ALTER TABLE public.ai_decisions ADD COLUMN IF NOT EXISTS status text DEFAULT 'success';

-- 3. Ensure RLS allows admin access
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ai_decisions' AND policyname = 'Admins manage AI decisions'
    ) THEN
        DROP POLICY IF EXISTS "Admins can view AI decisions" ON public.ai_decisions;
        CREATE POLICY "Admins manage AI decisions" ON public.ai_decisions FOR ALL 
        USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
    END IF;
END $$;

-- 4. Grant Permissions
GRANT ALL ON public.ai_config TO service_role;
GRANT ALL ON public.ai_decisions TO service_role;
GRANT SELECT ON public.ai_decisions TO authenticated;
