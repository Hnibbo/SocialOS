-- Fix database permission errors for critical tables
-- Migration: 20260117300000_fix_permissions

-- Ensure user_preferences table exists and has permissions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'user_preferences'
        AND schemaname = 'public'
    ) THEN
        CREATE TABLE user_preferences (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            theme_color text DEFAULT 'cyan',
            theme_mode text DEFAULT 'dark',
            language text DEFAULT 'en',
            timezone text DEFAULT 'UTC',
            notifications_enabled boolean DEFAULT true,
            email_notifications boolean DEFAULT true,
            push_notifications boolean DEFAULT true,
            created_at timestamptz DEFAULT NOW(),
            updated_at timestamptz DEFAULT NOW()
        );

        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own preferences" ON user_preferences
            FOR SELECT
            TO authenticated
            USING (user_id = auth.uid());

        CREATE POLICY "Users can update own preferences" ON user_preferences
            FOR ALL
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());

        GRANT ALL ON user_preferences TO authenticated;
    ELSE
        -- Table exists, just ensure permissions
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;

        CREATE POLICY "Users can view own preferences" ON user_preferences
            FOR SELECT
            TO authenticated
            USING (user_id = auth.uid());

        CREATE POLICY "Users can update own preferences" ON user_preferences
            FOR ALL
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());

        GRANT ALL ON user_preferences TO authenticated;
    END IF;
END $$;
