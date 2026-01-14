-- Hup v2.0 Database Migrations - Fixed
-- Memory, City Energy, Social Roles, Moment Drops, Loneliness Interrupter

-- Memory Capsules System
-- Stores visited places, people met, groups joined, moments shared
CREATE TABLE IF NOT EXISTS memory_capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    capsule_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content JSONB NOT NULL,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(10,8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shared_with UUID[] DEFAULT '{}',
    is_private BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    mood_score INTEGER DEFAULT 0,
    energy_score INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_memory_capsules_user_id ON memory_capsules(user_id, created_at DESC);

-- City Energy States
-- Every city, neighborhood, street has a live energy score
CREATE TABLE IF NOT EXISTS city_energy_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name TEXT NOT NULL,
    neighborhood TEXT,
    energy_level TEXT NOT NULL,
    energy_score INTEGER NOT NULL,
    user_count INTEGER DEFAULT 0,
    activity_count INTEGER DEFAULT 0,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location_bounds TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT ck_energy_level CHECK (energy_level IN ('party', 'calm', 'creative', 'dead', 'chaos', 'romantic', 'competitive')),
    CONSTRAINT ck_energy_score CHECK (energy_score >= 0 AND energy_score <= 100)
);

CREATE INDEX IF NOT EXISTS idx_city_energy_states_energy ON city_energy_states(energy_score DESC);

-- Moment Drops System
-- Random time-limited moments that appear on map
CREATE TABLE IF NOT EXISTS moment_drops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drop_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(10,8),
    radius_meters INTEGER DEFAULT 500,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    max_participants INTEGER DEFAULT 1000,
    current_participants INTEGER DEFAULT 0,
    rewards JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT ck_drop_type CHECK (drop_type IN ('flash_drinks', 'hidden_dj', 'mystery_group', 'rare_asset', 'confession_zone', 'dating_boost', 'anonymous_confession'))
);

CREATE INDEX IF NOT EXISTS idx_moment_drops_active ON moment_drops(is_active, end_time);

-- Real-time Social Signals
-- Signals appear on avatars: "Open to talk", "Don't approach", etc.
CREATE TABLE IF NOT EXISTS social_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL,
    signal_value TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    visibility_radius_meters INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT ck_signal_type CHECK (signal_type IN ('open_to_talk', 'dont_approach', 'looking_for_chaos', 'looking_for_calm', 'open_to_dating', 'just_watching', 'party_mode', 'needs_company', 'panic_mode'))
);

CREATE INDEX IF NOT EXISTS idx_social_signals_user_active ON social_signals(user_id, is_active, start_time DESC);

-- Loneliness Interrupter System
-- Detects when user is isolated/bored and triggers intervention
CREATE TABLE IF NOT EXISTS loneliness_detection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    isolation_score INTEGER DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE,
    consecutive_inactive_periods INTEGER DEFAULT 0,
    intervention_triggered BOOLEAN DEFAULT FALSE,
    intervention_type TEXT,
    intervention_sent_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_isolation_score CHECK (isolation_score >= 0 AND isolation_score <= 100)
);

-- Social Roles System
-- Roles are behavior-based, not purchased
CREATE TABLE IF NOT EXISTS user_social_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    role_type TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_level INTEGER DEFAULT 1,
    xp_points INTEGER DEFAULT 0,
    unlocks JSONB DEFAULT '{}',
    role_attributes JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT ck_role_type CHECK (role_type IN ('connector', 'explorer', 'host', 'muse', 'catalyst', 'ghost', 'legend', 'inactive')),
    CONSTRAINT ck_level CHECK (current_level >= 1)
);

CREATE INDEX IF NOT EXISTS idx_user_social_roles_active ON user_social_roles(user_id, is_active, earned_at DESC);

-- City Challenges System
-- Cities compete against each other
CREATE TABLE IF NOT EXISTS city_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_city_name TEXT,
    defender_city_name TEXT,
    challenge_type TEXT NOT NULL,
    challenge_title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    target_user_count INTEGER DEFAULT 100,
    current_participants INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    rewards JSONB DEFAULT '{}',
    CONSTRAINT ck_challenge_type CHECK (challenge_type IN ('fill_this_bar', 'create_group_strangers', 'turn_area_alive', 'meet_outside_type', 'sponsor_moment_drop', 'host_anonymous_night')),
    CONSTRAINT ck_completion CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

CREATE INDEX IF NOT EXISTS idx_city_challenges_active ON city_challenges(is_active, end_time);

-- Enable Row Level Security on all new tables
ALTER TABLE memory_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_energy_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loneliness_detection ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_social_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE moment_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_challenges ENABLE ROW LEVEL SECURITY;

 -- RLS Policies
 -- Users can manage their own memory capsules
 DROP POLICY IF EXISTS "Users manage own capsules" ON memory_capsules;
 CREATE POLICY "Users manage own capsules"
 ON memory_capsules
 FOR ALL

 USING (user_id = auth.uid());

 -- Users can manage their own social signals
 DROP POLICY IF EXISTS "Users manage own signals" ON social_signals;
 CREATE POLICY "Users manage own signals"
 ON social_signals
 FOR ALL

 USING (user_id = auth.uid());

 -- Users can manage their own loneliness data
 DROP POLICY IF EXISTS "Users manage own loneliness" ON loneliness_detection;
 CREATE POLICY "Users manage own loneliness"
 ON loneliness_detection
 FOR ALL

 USING (user_id = auth.uid());

 -- Users can manage their own social roles
 DROP POLICY IF EXISTS "Users manage own roles" ON user_social_roles;
 CREATE POLICY "Users manage own roles"
 ON user_social_roles
 FOR ALL

 USING (user_id = auth.uid());

 -- Anyone can see active moment drops
 DROP POLICY IF EXISTS "Anyone see active moment drops" ON moment_drops;
 CREATE POLICY "Anyone see active moment drops"
 ON moment_drops
 FOR SELECT
 TO authenticated, anon
 USING (is_active = TRUE AND end_time > NOW());

 -- Anyone can see active city challenges
 DROP POLICY IF EXISTS "Anyone see active challenges" ON city_challenges;
 CREATE POLICY "Anyone see active challenges"
 ON city_challenges
 FOR SELECT
 TO authenticated, anon
 USING (is_active = TRUE);

 -- System can manage city energy (for admin functions)
 DROP POLICY IF EXISTS "System manages city energy" ON city_energy_states;
 CREATE POLICY "System manages city energy"
 ON city_energy_states
 FOR ALL
 TO authenticated
 WITH CHECK (true);

-- Comments
COMMENT ON TABLE memory_capsules IS 'Stores personal life archives - places visited, people met, groups joined, moments shared';
COMMENT ON TABLE city_energy_states IS 'Live energy scores for cities and neighborhoods';
COMMENT ON TABLE social_signals IS 'Real-time status signals shown on user avatars';
COMMENT ON TABLE loneliness_detection IS 'Detects isolation patterns and triggers interventions';
COMMENT ON TABLE user_social_roles IS 'Behavior-based roles: Connector, Explorer, Host, Muse, Catalyst, Ghost, Legend';
COMMENT ON TABLE moment_drops IS 'Viral time-limited events that create mass convergence';
COMMENT ON TABLE city_challenges IS 'City vs city competitions for engagement';
