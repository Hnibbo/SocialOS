-- Add api_token to user_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='user_profiles' AND column_name='api_token') THEN
        ALTER TABLE user_profiles ADD COLUMN api_token TEXT;
    END IF;
END $$;

-- Drop and recreate the view to include the new column
DROP VIEW IF EXISTS profiles;
CREATE OR REPLACE VIEW profiles AS SELECT * FROM user_profiles;

-- Grant permissions again
GRANT SELECT, UPDATE ON user_profiles TO anon;
GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, UPDATE ON profiles TO anon;
GRANT SELECT, UPDATE ON profiles TO authenticated;
