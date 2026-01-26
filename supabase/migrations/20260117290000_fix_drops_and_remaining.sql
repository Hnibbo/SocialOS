-- Fix remaining database issues for drops and other tables
-- Migration: 20260117290000

-- Ensure PostGIS extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Fix drops table - recreate with correct location column type if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'drops'
    ) THEN
        -- Check if location column has wrong type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'drops' 
            AND column_name = 'location'
            AND udt_name = 'point'
        ) THEN
            -- Drop and recreate drops table with correct PostGIS geometry type
            DROP TABLE IF EXISTS drops CASCADE;
        END IF;
    END IF;
END $$;

-- Create drops table if it doesn't exist or was dropped
CREATE TABLE IF NOT EXISTS drops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    type text DEFAULT 'digital',
    media_url text,
    thumbnail_url text,
    location_lat double precision,
    location_lng double precision,
    location_name text,
    location geometry(Point, 4326),
    rarity text DEFAULT 'common',
    category text DEFAULT 'collectible',
    total_drops integer DEFAULT 1,
    collected_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_claimable boolean DEFAULT true,
    expiry_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Create index on location for spatial queries
CREATE INDEX IF NOT EXISTS drops_location_idx ON drops USING GIST(location);

-- Enable RLS
ALTER TABLE drops ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'drops' 
        AND policyname = 'Users can view active drops'
    ) THEN
        CREATE POLICY "Users can view active drops" ON drops
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'drops' 
        AND policyname = 'Users can claim drops'
    ) THEN
        CREATE POLICY "Users can claim drops" ON drops
            FOR UPDATE USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'drops' 
        AND policyname = 'Admins can manage drops'
    ) THEN
        CREATE POLICY "Admins can manage drops" ON drops
            FOR ALL USING (EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            ));
    END IF;
END $$;

-- 2. Create or fix user_inventory table
CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    drop_id UUID REFERENCES drops(id) ON DELETE CASCADE,
    acquired_at timestamp with time zone DEFAULT NOW(),
    is_equipped boolean DEFAULT false,
    metadata jsonb DEFAULT '{}',
    UNIQUE(user_id, drop_id)
);

-- Enable RLS
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_inventory' 
        AND policyname = 'Users can view their inventory'
    ) THEN
        CREATE POLICY "Users can view their inventory" ON user_inventory
            FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_inventory' 
        AND policyname = 'Users can add items to inventory'
    ) THEN
        CREATE POLICY "Users can add items to inventory" ON user_inventory
            FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_inventory' 
        AND policyname = 'Admins can manage all inventory'
    ) THEN
        CREATE POLICY "Admins can manage all inventory" ON user_inventory
            FOR ALL USING (EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            ));
    END IF;
END $$;

-- 3. Create assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    type text NOT NULL,
    media_url text NOT NULL,
    thumbnail_url text,
    rarity text DEFAULT 'common',
    cost_credits integer DEFAULT 0,
    cost_hup numeric DEFAULT 0,
    is_limited boolean DEFAULT false,
    max_supply integer,
    current_supply integer DEFAULT 0,
    is_active boolean DEFAULT true,
    category text DEFAULT 'general',
    created_at timestamp with time zone DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assets' 
        AND policyname = 'Everyone can view active assets'
    ) THEN
        CREATE POLICY "Everyone can view active assets" ON assets
            FOR SELECT USING (is_active = true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'assets' 
        AND policyname = 'Admins can manage assets'
    ) THEN
        CREATE POLICY "Admins can manage assets" ON assets
            FOR ALL USING (EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            ));
    END IF;
END $$;

-- 4. Create user_asset_purchases table
CREATE TABLE IF NOT EXISTS user_asset_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    purchase_type text DEFAULT 'credits',
    purchase_amount numeric DEFAULT 0,
    purchased_at timestamp with time zone DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_asset_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_asset_purchases' 
        AND policyname = 'Users can view their purchases'
    ) THEN
        CREATE POLICY "Users can view their purchases" ON user_asset_purchases
            FOR SELECT USING (user_id = auth.uid());
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_asset_purchases' 
        AND policyname = 'Admins can view all purchases'
    ) THEN
        CREATE POLICY "Admins can view all purchases" ON user_asset_purchases
            FOR ALL USING (EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            ));
    END IF;
END $$;

-- 5. Create or update security_rules table
CREATE TABLE IF NOT EXISTS security_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_type text NOT NULL,
    rule_name text NOT NULL,
    rule_value jsonb NOT NULL,
    is_active boolean DEFAULT true,
    severity text DEFAULT 'medium',
    description text,
    created_by UUID REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT NOW(),
    updated_at timestamp with time zone DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE security_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'security_rules' 
        AND policyname = 'Admins can manage security rules'
    ) THEN
        CREATE POLICY "Admins can manage security rules" ON security_rules
            FOR ALL USING (EXISTS (
                SELECT 1 FROM user_roles 
                WHERE user_id = auth.uid() 
                AND role = 'admin'
            ));
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON drops TO authenticated;
GRANT ALL ON user_inventory TO authenticated;
GRANT ALL ON assets TO authenticated;
GRANT ALL ON user_asset_purchases TO authenticated;
GRANT ALL ON security_rules TO authenticated;
