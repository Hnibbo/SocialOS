-- Migration: Stripe Integration & Sync
-- Bridges the 'stripe' schema (extension) with 'public' tables

-- 1. Stripe Connect Accounts
-- Tracks user-to-stripe mappings for creators
CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    stripe_account_id TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'active', 'restricted')) DEFAULT 'pending',
    details_submitted BOOLEAN DEFAULT FALSE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Sync Triggers: Stripe Products -> Public Plans
-- This ensures that when products are updated via the Stripe extension, our UI tables stay fresh
CREATE OR REPLACE FUNCTION public.sync_stripe_product_to_plans()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.subscription_plans (
        name,
        slug,
        description,
        stripe_product_id,
        is_active,
        updated_at
    )
    VALUES (
        new.name,
        COALESCE(new.metadata->>'slug', lower(replace(new.name, ' ', '-'))),
        new.description,
        new.id,
        new.active,
        now()
    )
    ON CONFLICT (stripe_product_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        is_active = EXCLUDED.is_active,
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Sync Triggers: Stripe Prices -> Public Plans (Prices)
CREATE OR REPLACE FUNCTION public.sync_stripe_price_to_plans()
RETURNS TRIGGER AS $$
BEGIN
    -- This assumes monthly/yearly prices map to our local columns
    -- In a real scenario, you'd match by product_id and metadata
    UPDATE public.subscription_plans
    SET 
        price_monthly = CASE WHEN new.interval = 'month' THEN (new.unit_amount / 100.0) ELSE price_monthly END,
        price_yearly = CASE WHEN new.interval = 'year' THEN (new.unit_amount / 100.0) ELSE price_yearly END,
        stripe_price_monthly = CASE WHEN new.interval = 'month' THEN new.id ELSE stripe_price_monthly END,
        stripe_price_yearly = CASE WHEN new.interval = 'year' THEN new.id ELSE stripe_price_yearly END
    WHERE stripe_product_id = new.product_id;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Sync Triggers: Stripe Subscriptions -> Public User Subscriptions
CREATE OR REPLACE FUNCTION public.sync_stripe_subscription_to_user()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_plan_id UUID;
BEGIN
    -- Get user_id from metadata or lookup
    v_user_id := (new.metadata->>'user_id')::UUID;
    
    -- Get local plan_id from stripe_product_id
    SELECT id INTO v_plan_id FROM public.subscription_plans WHERE stripe_product_id = (SELECT product_id FROM stripe.prices WHERE id = new.price_id);

    IF v_user_id IS NOT NULL AND v_plan_id IS NOT NULL THEN
        INSERT INTO public.user_subscriptions (
            user_id,
            plan_id,
            status,
            started_at,
            expires_at
        )
        VALUES (
            v_user_id,
            v_plan_id,
            new.status,
            new.current_period_start,
            new.current_period_end
        )
        ON CONFLICT (user_id) DO UPDATE SET
            plan_id = EXCLUDED.plan_id,
            status = EXCLUDED.status,
            started_at = EXCLUDED.started_at,
            expires_at = EXCLUDED.expires_at;
    END IF;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The triggers themselves can only be created if the stripe schema exists.
-- Since the extension might be installed but schema visibility is tricky in migrations,
-- we wrap trigger creation in a block that checks for the schema.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'stripe') THEN
        DROP TRIGGER IF EXISTS tr_sync_stripe_products ON stripe.products;
        CREATE TRIGGER tr_sync_stripe_products
            AFTER INSERT OR UPDATE ON stripe.products
            FOR EACH ROW EXECUTE FUNCTION public.sync_stripe_product_to_plans();

        DROP TRIGGER IF EXISTS tr_sync_stripe_prices ON stripe.prices;
        CREATE TRIGGER tr_sync_stripe_prices
            AFTER INSERT OR UPDATE ON stripe.prices
            FOR EACH ROW EXECUTE FUNCTION public.sync_stripe_price_to_plans();

        DROP TRIGGER IF EXISTS tr_sync_stripe_subscriptions ON stripe.subscriptions;
        CREATE TRIGGER tr_sync_stripe_subscriptions
            AFTER INSERT OR UPDATE ON stripe.subscriptions
            FOR EACH ROW EXECUTE FUNCTION public.sync_stripe_subscription_to_user();
    END IF;
END $$;
