-- Migration: Create missing tables and fix permissions
-- Addresses critical bugs:
-- 1. Missing businesses table
-- 2. Missing gdpr_requests table
-- 3. Missing support_conversations table  
-- 4. Missing giveaways table
-- 5. Fix live_streams table schema
-- 6. Fix permissions for all critical tables

-- 1. Create businesses table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'businesses'
        AND schemaname = 'public'
    ) THEN
        CREATE TABLE public.businesses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            location TEXT,
            status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );

        ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

        -- RLS Policies for businesses
        CREATE POLICY "Businesses visible to authenticated users"
            ON public.businesses FOR SELECT
            TO authenticated
            USING (true);

        CREATE POLICY "Business owners can manage their businesses"
            ON public.businesses FOR ALL
            TO authenticated
            USING (auth.uid() = owner_id)
            WITH CHECK (auth.uid() = owner_id);

        -- Admin policy (for super admin)
        CREATE POLICY "Admins can manage all businesses"
            ON public.businesses FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.businesses TO authenticated;
    ELSE
        -- Ensure all columns exist
        ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE;
        ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS name TEXT;
        ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS category TEXT;
        ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS location TEXT;
        ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')) DEFAULT 'pending';
        ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
        ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

        -- Ensure RLS is enabled and policies exist
        ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Businesses visible to authenticated users" ON public.businesses;
        DROP POLICY IF EXISTS "Business owners can manage their businesses" ON public.businesses;
        DROP POLICY IF EXISTS "Admins can manage all businesses" ON public.businesses;

        CREATE POLICY "Businesses visible to authenticated users"
            ON public.businesses FOR SELECT
            TO authenticated
            USING (true);

        CREATE POLICY "Business owners can manage their businesses"
            ON public.businesses FOR ALL
            TO authenticated
            USING (auth.uid() = owner_id)
            WITH CHECK (auth.uid() = owner_id);

        CREATE POLICY "Admins can manage all businesses"
            ON public.businesses FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.businesses TO authenticated;
    END IF;
END $$;

-- 2. Create gdpr_requests table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'gdpr_requests'
        AND schemaname = 'public'
    ) THEN
        CREATE TABLE public.gdpr_requests (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            request_type TEXT CHECK (request_type IN ('export', 'delete')) NOT NULL,
            status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            completed_at TIMESTAMP WITH TIME ZONE
        );

        ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own GDPR requests"
            ON public.gdpr_requests FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can create GDPR requests"
            ON public.gdpr_requests FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Admins can manage all GDPR requests"
            ON public.gdpr_requests FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.gdpr_requests TO authenticated;
    ELSE
        ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own GDPR requests" ON public.gdpr_requests;
        DROP POLICY IF EXISTS "Users can create GDPR requests" ON public.gdpr_requests;
        DROP POLICY IF EXISTS "Admins can manage all GDPR requests" ON public.gdpr_requests;

        CREATE POLICY "Users can view own GDPR requests"
            ON public.gdpr_requests FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can create GDPR requests"
            ON public.gdpr_requests FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Admins can manage all GDPR requests"
            ON public.gdpr_requests FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.gdpr_requests TO authenticated;
    END IF;
END $$;

-- 3. Create support_conversations table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'support_conversations'
        AND schemaname = 'public'
    ) THEN
        CREATE TABLE public.support_conversations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            subject TEXT,
            status TEXT CHECK (status IN ('open', 'closed', 'resolved')) DEFAULT 'open',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );

        ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view own support conversations"
            ON public.support_conversations FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can create support conversations"
            ON public.support_conversations FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own support conversations"
            ON public.support_conversations FOR UPDATE
            TO authenticated
            USING (auth.uid() = user_id);

        CREATE POLICY "Admins can manage all support conversations"
            ON public.support_conversations FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.support_conversations TO authenticated;
    ELSE
        ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Users can view own support conversations" ON public.support_conversations;
        DROP POLICY IF EXISTS "Users can create support conversations" ON public.support_conversations;
        DROP POLICY IF EXISTS "Users can update own support conversations" ON public.support_conversations;
        DROP POLICY IF EXISTS "Admins can manage all support conversations" ON public.support_conversations;

        CREATE POLICY "Users can view own support conversations"
            ON public.support_conversations FOR SELECT
            TO authenticated
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can create support conversations"
            ON public.support_conversations FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own support conversations"
            ON public.support_conversations FOR UPDATE
            TO authenticated
            USING (auth.uid() = user_id);

        CREATE POLICY "Admins can manage all support conversations"
            ON public.support_conversations FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.support_conversations TO authenticated;
    END IF;
END $$;

-- 4. Create giveaways table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'giveaways'
        AND schemaname = 'public'
    ) THEN
        CREATE TABLE public.giveaways (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            start_date TIMESTAMP WITH TIME ZONE,
            end_date TIMESTAMP WITH TIME ZONE,
            prize TEXT,
            status TEXT CHECK (status IN ('upcoming', 'active', 'ended')) DEFAULT 'upcoming',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );

        ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Giveaways visible to all authenticated users"
            ON public.giveaways FOR SELECT
            TO authenticated
            USING (true);

        CREATE POLICY "Admins can manage giveaways"
            ON public.giveaways FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.giveaways TO authenticated;
    ELSE
        ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Giveaways visible to all authenticated users" ON public.giveaways;
        DROP POLICY IF EXISTS "Admins can manage giveaways" ON public.giveaways;

        CREATE POLICY "Giveaways visible to all authenticated users"
            ON public.giveaways FOR SELECT
            TO authenticated
            USING (true);

        CREATE POLICY "Admins can manage giveaways"
            ON public.giveaways FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.giveaways TO authenticated;
    END IF;
END $$;

-- 5. Fix live_streams table - ensure room_name column exists
DO $$
BEGIN
    ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS room_name TEXT UNIQUE;
    ALTER TABLE public.live_streams ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT);

    -- Fix RLS policies for live_streams
    ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public streams visible to authenticated users" ON public.live_streams;
    DROP POLICY IF EXISTS "Hosts can manage own streams" ON public.live_streams;

    CREATE POLICY "Public streams visible to authenticated users"
        ON public.live_streams FOR SELECT
        USING (auth.role() = 'authenticated' AND (visibility = 'public' OR host_id = auth.uid()));

    CREATE POLICY "Hosts can manage own streams"
        ON public.live_streams FOR ALL
        USING (auth.uid() = host_id);

    -- Admin policy for live_streams
    CREATE POLICY "Admins can manage all streams"
        ON public.live_streams FOR ALL
        TO authenticated
        USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

    GRANT ALL ON public.live_streams TO authenticated;
END $$;

-- 6. Fix platform_config table (formerly platform_settings)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'platform_config'
        AND schemaname = 'public'
    ) THEN
        CREATE TABLE public.platform_config (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            value JSONB,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );

        ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Platform config visible to all authenticated users"
            ON public.platform_config FOR SELECT
            TO authenticated
            USING (true);

        CREATE POLICY "Admins can manage platform config"
            ON public.platform_config FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.platform_config TO authenticated;

        -- Insert default config values
        INSERT INTO public.platform_config (key, value, description) VALUES
            ('general', '{"site_name": "Hup Social OS", "maintenance_mode": false}', 'General platform settings'),
            ('features', '{"live_streaming": true, "dating": true, "chat": true}', 'Feature toggles'),
            ('limits', '{"max_profile_images": 10, "max_post_length": 500}', 'User limits');
    ELSE
        ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Platform config visible to all authenticated users" ON public.platform_config;
        DROP POLICY IF EXISTS "Admins can manage platform config" ON public.platform_config;

        CREATE POLICY "Platform config visible to all authenticated users"
            ON public.platform_config FOR SELECT
            TO authenticated
            USING (true);

        CREATE POLICY "Admins can manage platform config"
            ON public.platform_config FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.platform_config TO authenticated;
    END IF;
END $$;

-- 7. Fix security_rules table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE tablename = 'security_rules'
        AND schemaname = 'public'
    ) THEN
        CREATE TABLE public.security_rules (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            rule_name TEXT NOT NULL,
            rule_type TEXT NOT NULL,
            conditions JSONB,
            action TEXT NOT NULL,
            enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
        );

        ALTER TABLE public.security_rules ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Security rules visible to admins"
            ON public.security_rules FOR SELECT
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        CREATE POLICY "Admins can manage security rules"
            ON public.security_rules FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.security_rules TO authenticated;
    ELSE
        ALTER TABLE public.security_rules ENABLE ROW LEVEL SECURITY;

        DROP POLICY IF EXISTS "Security rules visible to admins" ON public.security_rules;
        DROP POLICY IF EXISTS "Admins can manage security rules" ON public.security_rules;

        CREATE POLICY "Security rules visible to admins"
            ON public.security_rules FOR SELECT
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        CREATE POLICY "Admins can manage security rules"
            ON public.security_rules FOR ALL
            TO authenticated
            USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

        GRANT ALL ON public.security_rules TO authenticated;
    END IF;
END $$;

-- 8. Fix permissions for rpc functions
GRANT EXECUTE ON FUNCTION public.admin_deactivate_user(uuid) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_active_streams_on_map() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_stream_viewers(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stream_viewers(uuid) TO authenticated;

-- 9. Verify all tables and functions are created correctly
SELECT 'businesses' as table_name, count(*) as record_count FROM public.businesses UNION ALL
SELECT 'gdpr_requests', count(*) FROM public.gdpr_requests UNION ALL
SELECT 'support_conversations', count(*) FROM public.support_conversations UNION ALL
SELECT 'giveaways', count(*) FROM public.giveaways UNION ALL
SELECT 'live_streams', count(*) FROM public.live_streams UNION ALL
SELECT 'platform_config', count(*) FROM public.platform_config UNION ALL
SELECT 'security_rules', count(*) FROM public.security_rules;
