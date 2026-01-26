-- Add persona column to user_profiles table for onboarding persona selection
-- Migration: 20260121172400_add_persona_column

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'persona'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN persona text;
    END IF;
END $$;
