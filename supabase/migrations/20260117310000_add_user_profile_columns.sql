-- Add missing columns to user_profiles table for presence and visibility features
-- Migration: 20260117310000_add_user_profile_columns

-- Add intent_signal column for user intent indicators
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'intent_signal'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN intent_signal text DEFAULT 'social';
    END IF;
END $$;

-- Add visibility_matrix column for granular privacy controls
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'visibility_matrix'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN visibility_matrix jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Add energy_level column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'energy_level'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN energy_level integer DEFAULT 50;
    END IF;
END $$;

-- Add credits_balance column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'credits_balance'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN credits_balance integer DEFAULT 0;
    END IF;
END $$;
