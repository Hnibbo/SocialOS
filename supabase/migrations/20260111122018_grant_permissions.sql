-- Grant permissions for platform_config table
GRANT SELECT ON platform_config TO anon;
GRANT SELECT ON platform_config TO authenticated;

-- Check if profiles table exists, if not use user_profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- If profiles doesn't exist but user_profiles does, create a view
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
            CREATE OR REPLACE VIEW profiles AS SELECT * FROM user_profiles;
            GRANT SELECT ON profiles TO anon;
            GRANT SELECT ON profiles TO authenticated;
        END IF;
    ELSE
        -- Profiles exists, just grant permissions
        GRANT SELECT ON profiles TO anon;
        GRANT SELECT ON profiles TO authenticated;
    END IF;
END $$;
