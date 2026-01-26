-- SOCIAL OS: NEURAL ENGINE TABLES
-- Ensures all AI configuration and decision tracking tables exist

-- 1. AI Feature Configuration
CREATE TABLE IF NOT EXISTS public.ai_config (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    feature text UNIQUE NOT NULL, -- 'support_bot', 'feed_analyzer', etc.
    enabled boolean DEFAULT true,
    model text NOT NULL,
    system_prompt text NOT NULL,
    temperature numeric DEFAULT 0.7,
    max_tokens integer DEFAULT 1000,
    daily_cost_limit numeric DEFAULT 50.0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. AI Decision Tracking
CREATE TABLE IF NOT EXISTS public.ai_decisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    feature text NOT NULL,
    decision text NOT NULL,
    confidence numeric,
    latency_ms integer,
    cost numeric DEFAULT 0,
    is_overridden boolean DEFAULT false,
    override_reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- RLS
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage AI config" ON public.ai_config FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view AI decisions" ON public.ai_decisions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Grants
GRANT ALL ON public.ai_config TO authenticated;
GRANT ALL ON public.ai_decisions TO authenticated;
