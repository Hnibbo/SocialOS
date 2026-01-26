-- Add subscription fields to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expires TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_price_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_stripe_id TEXT,
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Create credit_purchases table
CREATE TABLE IF NOT EXISTS credit_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    credits INTEGER NOT NULL,
    amount INTEGER NOT NULL, -- in cents
    stripe_payment_intent_id TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create credit_transactions table for tracking credit usage
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- negative for spending, positive for earning
    type TEXT NOT NULL, -- 'purchase', 'usage', 'refund', 'bonus'
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription ON user_profiles(subscription_tier, subscription_status);

-- Row Level Security
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_purchases
CREATE POLICY "Users can view their own credit purchases"
    ON credit_purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit purchases"
    ON credit_purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for credit_transactions
CREATE POLICY "Users can view their own credit transactions"
    ON credit_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credit transactions"
    ON credit_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to add credits to user
CREATE OR REPLACE FUNCTION add_user_credits(
    user_id_param UUID,
    credits_to_add INTEGER,
    payment_intent_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Add credits to user profile
    UPDATE user_profiles 
    SET credits = credits + credits_to_add
    WHERE id = user_id_param;
    
    -- Record the transaction
    INSERT INTO credit_transactions (
        user_id, 
        amount, 
        type, 
        description,
        metadata
    ) VALUES (
        user_id_param, 
        credits_to_add, 
        'purchase', 
        'Credits purchased',
        jsonb_build_object('payment_intent_id', payment_intent_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to deduct credits
CREATE OR REPLACE FUNCTION deduct_user_credits(
    user_id_param UUID,
    credits_to_deduct INTEGER,
    transaction_description TEXT,
    transaction_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT credits INTO current_credits
    FROM user_profiles
    WHERE id = user_id_param;
    
    -- Check if user has enough credits
    IF current_credits < credits_to_deduct THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credits
    UPDATE user_profiles 
    SET credits = credits - credits_to_deduct
    WHERE id = user_id_param;
    
    -- Record the transaction
    INSERT INTO credit_transactions (
        user_id, 
        amount, 
        type, 
        description,
        metadata
    ) VALUES (
        user_id_param, 
        -credits_to_deduct, 
        'usage', 
        transaction_description,
        transaction_metadata
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;