-- ULTIMATE FINANCE & WEB3 SYSTEM
-- Robust auditing, escrow, and multi-currency support

-- 1. Consolidated Financial Transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    receiver_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'HUP',
    type text NOT NULL, -- 'transfer', 'payment', 'payout', 'deposit', 'withdrawal', 'reward', 'escrow_hold', 'escrow_release'
    status text DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled', 'refunded'
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    tx_hash text, -- For Web3 tracking
    escrow_id uuid, -- Link to escrow table if part of a trade
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Escrow Agreements for P2P Commerce
CREATE TABLE IF NOT EXISTS public.escrow_agreements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    buyer_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    amount numeric NOT NULL,
    currency text NOT NULL DEFAULT 'HUP',
    asset_id uuid, -- Optional link to digital_assets
    description text,
    status text DEFAULT 'active', -- 'active', 'completed', 'disputed', 'refunded'
    terms jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);

-- 3. User Inventory (Owned NFTs, Items, Fractions)
CREATE TABLE IF NOT EXISTS public.user_inventory (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    catalog_item_id uuid REFERENCES public.digital_assets(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text,
    asset_type text NOT NULL, -- 'nft', 'badge', 'item', 'fragment', 'card'
    media_url text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_tradable boolean DEFAULT true,
    rarity text DEFAULT 'common',
    acquired_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_inventory ENABLE ROW LEVEL SECURITY;

-- 5. Finance Policies
CREATE POLICY "Users can view their own financial transactions"
ON public.financial_transactions FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can view their own escrow agreements"
ON public.escrow_agreements FOR SELECT
USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

CREATE POLICY "Users can view inventory"
ON public.user_inventory FOR SELECT
USING (true);

CREATE POLICY "Users can manage their own inventory"
ON public.user_inventory FOR ALL
USING (auth.uid() = user_id);

-- 6. Helper Functions
-- Atomic Transfer function (Simplified)
CREATE OR REPLACE FUNCTION public.transfer_hup(
    p_receiver_id uuid,
    p_amount numeric,
    p_description text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_balance numeric;
BEGIN
    -- Check sender balance
    SELECT balance INTO v_sender_balance FROM public.wallets WHERE user_id = auth.uid();
    
    IF v_sender_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Update sender balance
    UPDATE public.wallets SET balance = balance - p_amount WHERE user_id = auth.uid();
    
    -- Update receiver balance
    UPDATE public.wallets SET balance = balance + p_amount WHERE user_id = p_receiver_id;

    -- Log transaction
    INSERT INTO public.financial_transactions (sender_id, receiver_id, amount, type, status, description)
    VALUES (auth.uid(), p_receiver_id, p_amount, 'transfer', 'completed', p_description);

    RETURN true;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.financial_transactions TO authenticated;
GRANT SELECT ON public.escrow_agreements TO authenticated;
GRANT SELECT ON public.digital_assets TO authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_hup TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_finance_sender ON public.financial_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_finance_receiver ON public.financial_transactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_escrow_seller ON public.escrow_agreements(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_buyer ON public.escrow_agreements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON public.user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_item ON public.user_inventory(catalog_item_id);
