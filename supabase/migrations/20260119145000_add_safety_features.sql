-- Migration for safety features
-- Adds mutes table and two_factor_enabled column to user_profiles

-- Create mutes table
CREATE TABLE IF NOT EXISTS mutes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    muted_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    reason TEXT,
    muted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, muted_id)
);

-- Add two_factor_enabled column to user_profiles
ALTER TABLE IF EXISTS user_profiles 
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mutes_user_id ON mutes(user_id);
CREATE INDEX IF NOT EXISTS idx_mutes_muted_id ON mutes(muted_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_two_factor ON user_profiles(two_factor_enabled);

-- Add RLS policies for mutes table
CREATE POLICY "Users can view their own mutes" 
    ON mutes 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add mutes" 
    ON mutes 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mutes" 
    ON mutes 
    FOR DELETE 
    USING (auth.uid() = user_id);
