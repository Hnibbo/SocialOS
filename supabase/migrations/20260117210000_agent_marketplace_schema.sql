-- SOCIAL OS: AUTONOMOUS AGENT MARKETPLACE
-- Infrastructure for discovery, installation, and auditing of neural agents

-- 1. Marketplace Agents Listing
CREATE TABLE IF NOT EXISTS public.marketplace_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    category text NOT NULL, -- 'productivity', 'social', 'entertainment', 'utility'
    developer_name text DEFAULT 'Hup Neural Labs',
    icon_url text,
    price_xp integer DEFAULT 0,
    price_hup numeric DEFAULT 0,
    
    default_config jsonb DEFAULT '{}'::jsonb,
    system_prompt_template text,
    
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. User Installed Agents
CREATE TABLE IF NOT EXISTS public.user_installed_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    agent_id uuid REFERENCES public.marketplace_agents(id) ON DELETE CASCADE NOT NULL,
    
    is_enabled boolean DEFAULT true,
    custom_config jsonb DEFAULT '{}'::jsonb,
    
    last_run_at timestamp with time zone,
    total_runs integer DEFAULT 0,
    
    installed_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, agent_id)
);

-- 3. Agent Reasoning Traces (Audit Log)
CREATE TABLE IF NOT EXISTS public.agent_traces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    agent_id uuid REFERENCES public.marketplace_agents(id) ON DELETE SET NULL,
    
    action_name text NOT NULL,
    thought_process text,
    observation text,
    result text,
    
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_installed_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_traces ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active marketplace agents"
ON public.marketplace_agents FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage marketplace agents"
ON public.marketplace_agents FOR ALL
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own installations"
ON public.user_installed_agents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own installations"
ON public.user_installed_agents FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own agent traces"
ON public.agent_traces FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all agent traces"
ON public.agent_traces FOR SELECT
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Seed Initial Agents
INSERT INTO public.marketplace_agents (name, slug, description, category, price_xp, is_featured, icon_url)
VALUES 
('News Curator', 'news-curator', 'Autonomous news filtering based on your social vibe and interests.', 'productivity', 500, true, 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=100&h=100'),
('Vibe Guard', 'vibe-guard', 'Proactively filters toxic interactions and preserves your energy level automatically.', 'utility', 750, true, 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=100&h=100'),
('Networker', 'network-expander', 'Suggests high-value connections within your geospatial radius based on shared XP.', 'social', 1200, false, 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=100&h=100');

-- Grants
GRANT ALL ON public.marketplace_agents TO authenticated;
GRANT ALL ON public.user_installed_agents TO authenticated;
GRANT ALL ON public.agent_traces TO authenticated;
