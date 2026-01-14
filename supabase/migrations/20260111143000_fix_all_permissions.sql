-- Comprehensive RLS and Permissions Fix (Idempotent)

-- 1. Dating System
CREATE TABLE IF NOT EXISTS public.dating_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT false,
    bio TEXT,
    birth_date DATE,
    photos TEXT[],
    interests TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.dating_swipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    swiper_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    swiped_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    direction TEXT CHECK (direction IN ('left', 'right')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(swiper_id, swiped_id)
);

CREATE TABLE IF NOT EXISTS public.dating_matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user1_id, user2_id)
);

ALTER TABLE public.dating_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dating_matches ENABLE ROW LEVEL SECURITY;

-- Dating Policies (Drop first to avoid errors)
DROP POLICY IF EXISTS "Public read active dating profiles" ON public.dating_profiles;
DROP POLICY IF EXISTS "Users can manage own dating profile" ON public.dating_profiles;
CREATE POLICY "Public read active dating profiles" ON public.dating_profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage own dating profile" ON public.dating_profiles FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert swipes" ON public.dating_swipes;
DROP POLICY IF EXISTS "Users can read own swipes" ON public.dating_swipes;
CREATE POLICY "Users can insert swipes" ON public.dating_swipes FOR INSERT WITH CHECK (auth.uid() = swiper_id);
CREATE POLICY "Users can read own swipes" ON public.dating_swipes FOR SELECT USING (auth.uid() = swiper_id);

DROP POLICY IF EXISTS "Users can read own matches" ON public.dating_matches;
CREATE POLICY "Users can read own matches" ON public.dating_matches FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 2. Random Chat Queue
CREATE TABLE IF NOT EXISTS public.random_chat_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.random_chat_queue ENABLE ROW LEVEL SECURITY;

-- Chat Policies
DROP POLICY IF EXISTS "Authenticated users can join queue" ON public.random_chat_queue;
DROP POLICY IF EXISTS "Authenticated users can read queue" ON public.random_chat_queue;
DROP POLICY IF EXISTS "Users can remove themselves" ON public.random_chat_queue;

CREATE POLICY "Authenticated users can join queue" ON public.random_chat_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can read queue" ON public.random_chat_queue FOR SELECT USING (true);
CREATE POLICY "Users can remove themselves" ON public.random_chat_queue FOR DELETE USING (auth.uid() = user_id);

-- 3. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price_id TEXT, -- Stripe Price ID
    amount INTEGER,
    currency TEXT DEFAULT 'usd',
    interval TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status TEXT, -- active, canceled, past_due
    current_period_end TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscription Policies
DROP POLICY IF EXISTS "Public read subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Users read own subscription" ON public.user_subscriptions;

CREATE POLICY "Public read subscription plans" ON public.subscription_plans FOR SELECT USING (true);
CREATE POLICY "Users read own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- 4. User Presence (Fix Upsert Conflict)
DROP POLICY IF EXISTS "Users can manage own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Allow users to update own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Allow users to insert own presence" ON public.user_presence;

CREATE POLICY "Users can manage own presence" ON public.user_presence FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Groups (Fix 500 error)
DROP POLICY IF EXISTS "Public read groups" ON public.groups;
DROP POLICY IF EXISTS "Allow public read access to groups" ON public.groups;
DROP POLICY IF EXISTS "Authenticated create groups" ON public.groups;
DROP POLICY IF EXISTS "Allow authenticated create groups" ON public.groups;
DROP POLICY IF EXISTS "Creator manage groups" ON public.groups;

CREATE POLICY "Public read groups" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Authenticated create groups" ON public.groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creator manage groups" ON public.groups FOR UPDATE USING (auth.uid() = creator_id);

-- 6. Grant Permissions (Blind Grant for Maximum Compatibility)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dating_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dating_swipes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dating_matches TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.random_chat_queue TO anon, authenticated;
GRANT SELECT ON public.subscription_plans TO anon, authenticated;
GRANT SELECT ON public.user_subscriptions TO anon, authenticated;
