-- Add Stripe subscription fields to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_end timestamp with time zone;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer 
ON public.user_profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status 
ON public.user_profiles(subscription_status);

-- Create subscription_events table for audit trail
CREATE TABLE IF NOT EXISTS public.subscription_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    stripe_event_id text,
    subscription_tier text,
    amount integer,
    currency text DEFAULT 'usd',
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription events"
ON public.subscription_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert subscription events"
ON public.subscription_events
FOR INSERT
WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.subscription_events TO authenticated;
GRANT INSERT ON public.subscription_events TO service_role;

-- Create function to update subscription
CREATE OR REPLACE FUNCTION public.update_user_subscription(
    p_user_id uuid,
    p_stripe_customer_id text,
    p_stripe_subscription_id text,
    p_tier text,
    p_status text,
    p_start timestamp with time zone,
    p_end timestamp with time zone
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.user_profiles
    SET 
        stripe_customer_id = p_stripe_customer_id,
        stripe_subscription_id = p_stripe_subscription_id,
        subscription_tier = p_tier,
        subscription_status = p_status,
        subscription_start = p_start,
        subscription_end = p_end,
        updated_at = now()
    WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_subscription TO service_role;
