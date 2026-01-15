-- SOCIAL OS: DEFAULT AI CONFIGURATIONS
-- Attempt 3: Only mandatory and standard fields

INSERT INTO public.ai_config (feature, display_name, enabled, model, system_prompt, temperature, max_tokens, daily_cost_limit)
VALUES 
(
    'support_bot', 
    'Neural Assistant', 
    true, 
    'openai/gpt-4o', 
    'You are the Hup Social OS Neural Interface.', 
    0.7, 
    1000, 
    50.0
)
ON CONFLICT (feature) DO UPDATE SET
    model = EXCLUDED.model;
