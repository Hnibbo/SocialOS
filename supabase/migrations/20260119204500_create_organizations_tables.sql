-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT NULL,
    primary_color TEXT NULL,
    custom_domain TEXT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create organization_subscriptions table
CREATE TABLE IF NOT EXISTS organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_id TEXT REFERENCES subscription_plans(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active',
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add organization_id column to user_profiles
ALTER TABLE IF EXISTS user_profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create organization_roles table (for organization-specific roles)
CREATE TABLE IF NOT EXISTS organization_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
    granted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Create organization_settings table
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_org ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_roles_org ON organization_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_roles_user ON organization_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization ON user_profiles(organization_id);

-- Enable RLS for all new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for organizations (admins only)
CREATE POLICY "Admins can read organizations" 
    ON organizations 
    FOR SELECT 
    USING (true);

CREATE POLICY "Admins can create organizations" 
    ON organizations 
    FOR INSERT 
    WITH CHECK (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

CREATE POLICY "Admins can update organizations" 
    ON organizations 
    FOR UPDATE 
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

CREATE POLICY "Admins can delete organizations" 
    ON organizations 
    FOR DELETE 
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- RLS policies for organization_subscriptions
CREATE POLICY "Admins can read organization subscriptions" 
    ON organization_subscriptions 
    FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage organization subscriptions" 
    ON organization_subscriptions 
    FOR ALL 
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- RLS policies for organization_roles
CREATE POLICY "Admins can read organization roles" 
    ON organization_roles 
    FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage organization roles" 
    ON organization_roles 
    FOR ALL 
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- RLS policies for organization_settings
CREATE POLICY "Admins can read organization settings" 
    ON organization_settings 
    FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage organization settings" 
    ON organization_settings 
    FOR ALL 
    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER set_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_organization_subscriptions_updated_at
    BEFORE UPDATE ON organization_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_organization_roles_updated_at
    BEFORE UPDATE ON organization_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_organization_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_settings TO authenticated;

-- Grant permissions to service_role
GRANT ALL PRIVILEGES ON organizations TO service_role;
GRANT ALL PRIVILEGES ON organization_subscriptions TO service_role;
GRANT ALL PRIVILEGES ON organization_roles TO service_role;
GRANT ALL PRIVILEGES ON organization_settings TO service_role;
