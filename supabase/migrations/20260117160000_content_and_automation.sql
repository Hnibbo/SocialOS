-- SOCIAL OS: CONTENT & AUTOMATION INFRASTRUCTURE REPAIR
-- Harmonizing existing auto_tasks and platform_pages schema

-- 1. Ensure platform_pages exist
CREATE TABLE IF NOT EXISTS public.platform_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    description text,
    content jsonb DEFAULT '[]'::jsonb,
    is_published boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Ensure auto_tasks exist
CREATE TABLE IF NOT EXISTS public.auto_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type text NOT NULL,
    status text DEFAULT 'pending',
    run_at timestamp with time zone DEFAULT now()
);

-- 3. Add missing columns to auto_tasks
ALTER TABLE public.auto_tasks ADD COLUMN IF NOT EXISTS details text;
ALTER TABLE public.auto_tasks ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.auto_tasks ADD COLUMN IF NOT EXISTS duration_ms integer;

-- 4. Enable RLS
ALTER TABLE public.platform_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_tasks ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Idempotent)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public can view published pages" ON public.platform_pages;
    CREATE POLICY "Public can view published pages" ON public.platform_pages FOR SELECT USING (is_published);

    DROP POLICY IF EXISTS "Admins manage platform pages" ON public.platform_pages;
    CREATE POLICY "Admins manage platform pages" ON public.platform_pages FOR ALL USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );

    DROP POLICY IF EXISTS "Admins view auto tasks" ON public.auto_tasks;
    CREATE POLICY "Admins view auto tasks" ON public.auto_tasks FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    );
END $$;

-- 6. Helper Function: Log Auto Task
CREATE OR REPLACE FUNCTION public.log_auto_task(
    p_type text,
    p_status text,
    p_details text,
    p_duration integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id uuid;
BEGIN
    INSERT INTO public.auto_tasks (task_type, status, details, duration_ms)
    VALUES (p_type, p_status, p_details, p_duration)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$;

-- 7. Seed Data (Idempotent)
INSERT INTO public.platform_pages (slug, title, is_published, content)
VALUES (
    'vision',
    'The Social Operating System',
    true,
    '[
        {"id": "h1", "type": "hero", "data": {"title": "The Neural Social Layer", "subtitle": "Activate your node in the global social OS.", "buttonText": "Sync Now", "buttonLink": "/map"}},
        {"id": "s1", "type": "stats", "data": {"items": [{"label": "Active Nodes", "value": "1.2M+"}, {"label": "Daily Transmissions", "value": "45M"}, {"label": "Network Energy", "value": "98.4%"}]}},
        {"id": "f1", "type": "features", "data": {"title": "Autonomous Infrastructure", "items": [{"title": "Live Map", "description": "Real-time presence visualization with neural heatmaps."}, {"title": "Smart Wallet", "description": "Seamless cross-border transfers and asset vaulting."}, {"title": "AI Agents", "description": "Autonomous curators managing your social experience."}]}},
        {"id": "t1", "type": "text", "data": {"body": "Hup is the first operating system designed for human social dynamics. By integrating geospatial data, financial infrastructure, and AI reasoning, we create an environment where connections are meaningful, autonomous, and financially rewarding."}},
        {"id": "c1", "type": "cta", "data": {"title": "Join the Expansion", "buttonText": "Start Transmitting", "buttonLink": "/signup"}}
    ]'::jsonb
) ON CONFLICT (slug) DO UPDATE SET content = EXCLUDED.content;

-- Initial Task Logs
INSERT INTO public.auto_tasks (task_type, status, details)
SELECT 'fee_transmission', 'completed', 'Processed platform fees for last 24h: 12,450 HUP'
WHERE NOT EXISTS (SELECT 1 FROM public.auto_tasks WHERE details LIKE 'Processed platform fees%');

INSERT INTO public.auto_tasks (task_type, status, details)
SELECT 'energy_regen', 'completed', 'Regenerated energy for 10,000+ nodes'
WHERE NOT EXISTS (SELECT 1 FROM public.auto_tasks WHERE details LIKE 'Regenerated energy%');

-- Grants
GRANT SELECT ON public.platform_pages TO anon, authenticated;
GRANT SELECT ON public.auto_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_auto_task TO authenticated;
