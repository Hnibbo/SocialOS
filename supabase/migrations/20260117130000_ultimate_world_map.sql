-- ULTIMATE TERRITORY & WORLD STATE
-- Gamified world map, territory claiming, and localized memory capsules

-- 1. World Cells (Territory Ownership)
CREATE TABLE IF NOT EXISTS public.territory_claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    cell_id text NOT NULL, -- Format: "lat_lng_bucket" (e.g. "40.712_74.006")
    vibe_type text DEFAULT 'neutral', -- 'neon', 'phantom', 'zen', 'chaos'
    custom_name text,
    tax_rate numeric DEFAULT 0,
    claimed_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    UNIQUE(cell_id)
);

-- 2. Memory Capsules (Localized Persistent Data)
-- Adaptive extension for existing memory_capsules table
ALTER TABLE public.memory_capsules ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.memory_capsules ADD COLUMN IF NOT EXISTS location geography(POINT);
ALTER TABLE public.memory_capsules ADD COLUMN IF NOT EXISTS is_collectible boolean DEFAULT false;
ALTER TABLE public.memory_capsules ADD COLUMN IF NOT EXISTS rarity text DEFAULT 'common';
ALTER TABLE public.memory_capsules ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.memory_capsules ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- 3. World Energy States (Heatmap data)
CREATE TABLE IF NOT EXISTS public.world_energy_states (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cell_id text NOT NULL,
    lat numeric NOT NULL,
    lng numeric NOT NULL,
    energy_score integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Enable RLS
ALTER TABLE public.territory_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_energy_states ENABLE ROW LEVEL SECURITY;

-- 5. Policies
CREATE POLICY "Anyone can view territory claims" ON public.territory_claims FOR SELECT USING (true);
CREATE POLICY "Users can manage their own claims" ON public.territory_claims FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public capsules" ON public.memory_capsules FOR SELECT USING (NOT is_private OR auth.uid() = user_id);
CREATE POLICY "Users can manage their own capsules" ON public.memory_capsules FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view energy states" ON public.world_energy_states FOR SELECT USING (true);

-- 6. Helper Functions
-- Claim Territory RPC
CREATE OR REPLACE FUNCTION public.claim_territory(
    p_lat numeric,
    p_lng numeric,
    p_name text DEFAULT NULL,
    p_vibe text DEFAULT 'neutral'
)
RETURNS public.territory_claims
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cell_id text;
    v_cost numeric := 500; -- Cost to claim
    v_balance numeric;
    v_claim public.territory_claims;
BEGIN
    v_cell_id := format('%s_%s', round(p_lat, 3), round(p_lng, 3));
    
    -- Check balance
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = auth.uid();
    IF v_balance < v_cost THEN
        RAISE EXCEPTION 'Insufficient HUP to claim territory. Need 500 HUP.';
    END IF;

    -- Update balance
    UPDATE public.wallets SET balance = balance - v_cost WHERE user_id = auth.uid();

    -- Insert or Update claim (if expired)
    INSERT INTO public.territory_claims (user_id, cell_id, custom_name, vibe_type, expires_at)
    VALUES (auth.uid(), v_cell_id, p_name, p_vibe, now() + interval '7 days')
    ON CONFLICT (cell_id) DO UPDATE 
    SET user_id = EXCLUDED.user_id,
        custom_name = EXCLUDED.custom_name,
        vibe_type = EXCLUDED.vibe_type,
        claimed_at = now(),
        expires_at = EXCLUDED.expires_at
    RETURNING * INTO v_claim;

    -- Log transaction
    INSERT INTO public.financial_transactions (sender_id, amount, type, description)
    VALUES (auth.uid(), v_cost, 'payment', 'Territory Claim: ' || v_cell_id);

    RETURN v_claim;
END;
$$;

-- Get Cell Dominance RPC
CREATE OR REPLACE FUNCTION public.get_cell_dominance(
    p_lat numeric,
    p_lng numeric
)
RETURNS TABLE (
    dominant_user_name text,
    vibe_type text,
    custom_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_cell_id text;
BEGIN
    v_cell_id := format('%s_%s', round(p_lat, 3), round(p_lng, 3));
    RETURN QUERY
    SELECT up.display_name, tc.vibe_type, tc.custom_name
    FROM public.territory_claims tc
    JOIN public.user_profiles up ON tc.user_id = up.id
    WHERE tc.cell_id = v_cell_id
    AND (tc.expires_at IS NULL OR tc.expires_at > now());
END;
$$;

-- Grant permissions
GRANT SELECT ON public.territory_claims TO authenticated;
GRANT SELECT ON public.memory_capsules TO authenticated;
GRANT SELECT ON public.world_energy_states TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_territory TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cell_dominance TO authenticated;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_capsules_location ON public.memory_capsules USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_territory_cell ON public.territory_claims(cell_id);
