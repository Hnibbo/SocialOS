-- Create Withdrawals Table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'HUP',
    status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    method text NOT NULL, -- 'bank', 'paypal', 'crypto'
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create Deposits Table
CREATE TABLE IF NOT EXISTS public.deposits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'HUP',
    status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    method text NOT NULL, -- 'card', 'bank', 'crypto'
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Policies for Withdrawals
DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create withdrawals" ON public.withdrawals;
CREATE POLICY "Users can create withdrawals" ON public.withdrawals
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can update own withdrawals" ON public.withdrawals
FOR UPDATE USING (auth.uid() = user_id);

-- Policies for Deposits
DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposits;
CREATE POLICY "Users can view own deposits" ON public.deposits
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create deposits" ON public.deposits;
CREATE POLICY "Users can create deposits" ON public.deposits
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own deposits" ON public.deposits;
CREATE POLICY "Users can update own deposits" ON public.deposits
FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_deposits_user ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(status);
