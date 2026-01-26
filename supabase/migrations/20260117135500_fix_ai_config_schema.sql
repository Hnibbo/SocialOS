-- SOCIAL OS: NEURAL ENGINE SCHEMA FIX
-- Adding missing columns to ai_config

ALTER TABLE public.ai_config 
ADD COLUMN IF NOT EXISTS daily_cost_limit numeric DEFAULT 50.0;

-- Ensure RLS is active
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;
