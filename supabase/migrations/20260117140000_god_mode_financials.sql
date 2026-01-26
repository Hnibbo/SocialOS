-- SOCIAL OS: GOD MODE & FINANCIAL CORE
-- Integrating real AI, automated financials, and platform-wide configuration management

-- 1. Extend platform_config with critical keys if not present
INSERT INTO public.platform_config (key, value, category, display_name, description, is_secret)
VALUES 
('openrouter_api_key', '""', 'ai', 'OpenRouter API Key', 'Primary gateway for multi-model AI access', true),
('openai_api_key', '""', 'ai', 'OpenAI API Key', 'Direct access to OpenAI models', true),
('active_ai_provider', '"openrouter"', 'ai', 'Active AI Provider', 'Switch between "openrouter" and "openai"', false),
('platform_fee_percent', '5', 'finance', 'Platform Fee %', 'Percentage taken from every transaction/booking', false),
('hup_credit_exchange_rate', '1.0', 'finance', 'HUP Credit Rate', 'Exchange rate between HUP Credits and USD (1.0 = $1)', false)
ON CONFLICT (key) DO NOTHING;

-- 2. Financial Credits System
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS credits_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_connect_id text,
ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'not_started';

-- 3. CMS / Dynamic Content Table
-- Allows for the drag-and-drop / config-driven page editor
CREATE TABLE IF NOT EXISTS public.platform_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    content jsonb DEFAULT '[]'::jsonb, -- Array of blocks/components
    is_published boolean DEFAULT false,
    meta_tags jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. AI Subscriptions Table
CREATE TABLE IF NOT EXISTS public.ai_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type text NOT NULL, -- 'basic', 'pro', 'god'
    status text DEFAULT 'active',
    expires_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    UNIQUE(user_id)
);

-- 5. Autonomous Task Queue
-- For automated business processes
CREATE TABLE IF NOT EXISTS public.auto_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_type text NOT NULL, -- 'tax_calc', 'payout', 'content_audit'
    payload jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending',
    result jsonb,
    run_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone
);

-- 6. Enable RLS
ALTER TABLE public.platform_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_tasks ENABLE ROW LEVEL SECURITY;

-- 7. Policies
CREATE POLICY "Public can view published pages" ON public.platform_pages FOR SELECT USING (is_published);
CREATE POLICY "Admins can manage pages" ON public.platform_pages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Users can view their own AI sub" ON public.ai_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage AI subs" ON public.ai_subscriptions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage auto tasks" ON public.auto_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 8. RPC: Process Financial Action with Profit
CREATE OR REPLACE FUNCTION public.process_platform_transaction(
    p_amount numeric,
    p_receiver_id uuid,
    p_type text,
    p_description text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_fee_percent numeric;
    v_fee_amount numeric;
    v_net_amount numeric;
    v_sender_balance numeric;
BEGIN
    -- Get platform fee
    SELECT (value::text)::numeric INTO v_fee_percent 
    FROM public.platform_config WHERE key = 'platform_fee_percent';
    
    v_fee_amount := p_amount * (v_fee_percent / 100);
    v_net_amount := p_amount - v_fee_amount;

    -- Check sender balance
    SELECT credits_balance INTO v_sender_balance FROM public.wallets WHERE user_id = auth.uid();
    IF v_sender_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient credits for this transaction.';
    END IF;

    -- 1. Deduct from sender
    UPDATE public.wallets SET credits_balance = credits_balance - p_amount WHERE user_id = auth.uid();
    
    -- 2. Add net to receiver
    UPDATE public.wallets SET credits_balance = credits_balance + v_net_amount WHERE user_id = p_receiver_id;

    -- 3. Log main transaction
    INSERT INTO public.financial_transactions (sender_id, receiver_id, amount, type, description)
    VALUES (auth.uid(), p_receiver_id, v_net_amount, p_type, p_description);

    -- 4. Log platform fee (Profit)
    INSERT INTO public.financial_transactions (sender_id, amount, type, description)
    VALUES (auth.uid(), v_fee_amount, 'fee', 'Platform Fee for ' || p_type);

    RETURN true;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.platform_pages TO authenticated, anon;
GRANT ALL ON public.platform_pages TO authenticated;
GRANT ALL ON public.ai_subscriptions TO authenticated;
GRANT ALL ON public.auto_tasks TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_platform_transaction TO authenticated;
