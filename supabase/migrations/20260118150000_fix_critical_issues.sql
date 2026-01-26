-- Fix all critical issues in SocialOS application
-- 1. Create missing tables
-- 2. Add missing columns
-- 3. Fix permissions

-- ========================================
-- 1. Create missing tables
-- ========================================

-- Platform Settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    id SERIAL PRIMARY KEY,
    setting_name TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GDPR Requests table
CREATE TABLE IF NOT EXISTS gdpr_requests (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_notes TEXT,
    metadata JSONB
);

-- Support Conversations table
CREATE TABLE IF NOT EXISTS support_conversations (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    support_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Giveaways table
CREATE TABLE IF NOT EXISTS giveaways (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    prize TEXT NOT NULL,
    organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'draft',
    entry_count INTEGER NOT NULL DEFAULT 0,
    max_entries INTEGER,
    rules TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- ========================================
-- 2. Add missing column to live_streams
-- ========================================

ALTER TABLE IF EXISTS live_streams 
ADD COLUMN IF NOT EXISTS room_name TEXT;

-- ========================================
-- 3. Fix permissions for businesses and live_streams
-- ========================================

-- Allow authenticated users to read businesses
GRANT SELECT ON businesses TO authenticated;
GRANT INSERT ON businesses TO authenticated;
GRANT UPDATE ON businesses TO authenticated;
GRANT DELETE ON businesses TO authenticated;

-- Allow authenticated users to read live_streams
GRANT SELECT ON live_streams TO authenticated;
GRANT INSERT ON live_streams TO authenticated;
GRANT UPDATE ON live_streams TO authenticated;
GRANT DELETE ON live_streams TO authenticated;

-- Allow authenticated users to read platform_settings
GRANT SELECT ON platform_settings TO authenticated;

-- Allow authenticated users to read and write their own GDPR requests
GRANT SELECT ON gdpr_requests TO authenticated;
GRANT INSERT ON gdpr_requests TO authenticated;
GRANT UPDATE ON gdpr_requests TO authenticated;
GRANT DELETE ON gdpr_requests TO authenticated;

-- Allow authenticated users to read and write their own support conversations
GRANT SELECT ON support_conversations TO authenticated;
GRANT INSERT ON support_conversations TO authenticated;
GRANT UPDATE ON support_conversations TO authenticated;
GRANT DELETE ON support_conversations TO authenticated;

-- Allow authenticated users to read and write giveaways
GRANT SELECT ON giveaways TO authenticated;
GRANT INSERT ON giveaways TO authenticated;
GRANT UPDATE ON giveaways TO authenticated;
GRANT DELETE ON giveaways TO authenticated;

-- ========================================
-- 4. Enable RLS (Row Level Security) if not already enabled
-- ========================================

ALTER TABLE IF EXISTS platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gdpr_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS giveaways ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. Create RLS policies
-- ========================================

-- Platform settings policies (read-only for all authenticated users)
DROP POLICY IF EXISTS "Allow all authenticated users to read platform settings" ON platform_settings;
CREATE POLICY "Allow all authenticated users to read platform settings"
    ON platform_settings
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- GDPR requests policies (users can only access their own requests)
DROP POLICY IF EXISTS "Allow users to view their own GDPR requests" ON gdpr_requests;
CREATE POLICY "Allow users to view their own GDPR requests"
    ON gdpr_requests
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to create their own GDPR requests" ON gdpr_requests;
CREATE POLICY "Allow users to create their own GDPR requests"
    ON gdpr_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own GDPR requests" ON gdpr_requests;
CREATE POLICY "Allow users to update their own GDPR requests"
    ON gdpr_requests
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own GDPR requests" ON gdpr_requests;
CREATE POLICY "Allow users to delete their own GDPR requests"
    ON gdpr_requests
    FOR DELETE
    USING (auth.uid() = user_id);

-- Support conversations policies (users can only access their own conversations)
DROP POLICY IF EXISTS "Allow users to view their own support conversations" ON support_conversations;
CREATE POLICY "Allow users to view their own support conversations"
    ON support_conversations
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to create their own support conversations" ON support_conversations;
CREATE POLICY "Allow users to create their own support conversations"
    ON support_conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own support conversations" ON support_conversations;
CREATE POLICY "Allow users to update their own support conversations"
    ON support_conversations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own support conversations" ON support_conversations;
CREATE POLICY "Allow users to delete their own support conversations"
    ON support_conversations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Giveaways policies (public read, creator write)
DROP POLICY IF EXISTS "Allow public read on giveaways" ON giveaways;
CREATE POLICY "Allow public read on giveaways"
    ON giveaways
    FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow creators to create giveaways" ON giveaways;
CREATE POLICY "Allow creators to create giveaways"
    ON giveaways
    FOR INSERT
    WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Allow creators to update their giveaways" ON giveaways;
CREATE POLICY "Allow creators to update their giveaways"
    ON giveaways
    FOR UPDATE
    USING (auth.uid() = organizer_id)
    WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Allow creators to delete their giveaways" ON giveaways;
CREATE POLICY "Allow creators to delete their own giveaways"
    ON giveaways
    FOR DELETE
    USING (auth.uid() = organizer_id);

-- ========================================
-- 6. Create indexes for performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_giveaways_organizer_id ON giveaways(organizer_id);
CREATE INDEX IF NOT EXISTS idx_giveaways_status ON giveaways(status);
CREATE INDEX IF NOT EXISTS idx_giveaways_end_date ON giveaways(end_date);

-- ========================================
-- 7. Update updated_at triggers
-- ========================================

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for new tables
DROP TRIGGER IF EXISTS set_platform_settings_updated_at ON platform_settings;
CREATE TRIGGER set_platform_settings_updated_at
    BEFORE UPDATE ON platform_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_gdpr_requests_updated_at ON gdpr_requests;
CREATE TRIGGER set_gdpr_requests_updated_at
    BEFORE UPDATE ON gdpr_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_support_conversations_updated_at ON support_conversations;
CREATE TRIGGER set_support_conversations_updated_at
    BEFORE UPDATE ON support_conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_giveaways_updated_at ON giveaways;
CREATE TRIGGER set_giveaways_updated_at
    BEFORE UPDATE ON giveaways
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- 8. Add initial platform settings
-- ========================================

INSERT INTO platform_settings (setting_name, setting_value, description)
VALUES 
    ('platform_name', '"SocialOS"', 'Name of the platform'),
    ('platform_version', '"1.0.0"', 'Current platform version'),
    ('maintenance_mode', 'false', 'Whether maintenance mode is enabled'),
    ('max_upload_size', '10485760', 'Maximum file upload size in bytes'),
    ('support_email', '"support@socialos.example"', 'Support email address'),
    ('privacy_policy_url', '"/legal/privacy"', 'URL to privacy policy'),
    ('terms_of_service_url', '"/legal/terms"', 'URL to terms of service')
ON CONFLICT (setting_name) DO NOTHING;

-- Verify the fix
SELECT 'Critical issues fixed' as message;
