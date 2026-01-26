-- Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance numeric DEFAULT 0.00 NOT NULL,
  currency text DEFAULT 'HUP' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can update balances effectively (or admin)
-- We'll allow users to READ only.

-- Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id uuid REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL, -- 'deposit', 'send', 'receive', 'reward', 'purchase'
  status text DEFAULT 'completed', -- 'pending', 'completed', 'failed'
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.transactions
FOR SELECT USING (
    wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid())
);

-- Note: Wallets will be created automatically when users register via auth.users hook
-- No manual seeding needed for existing users

