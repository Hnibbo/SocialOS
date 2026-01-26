-- Fix RLS policies for platform_config table
-- This allows anonymous users to read platform configuration

-- Enable RLS
ALTER TABLE IF EXISTS platform_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public configs are viewable by everyone" ON platform_config;
DROP POLICY IF EXISTS "Allow public read access to public configs" ON platform_config;
DROP POLICY IF EXISTS "Authenticated users can read all configs" ON platform_config;
DROP POLICY IF EXISTS "Only admins can modify configs" ON platform_config;
DROP POLICY IF EXISTS "Allow anonymous read access" ON platform_config;

-- Allow everyone (including anonymous) to read all platform configs
CREATE POLICY "Allow anonymous read access"
ON platform_config
FOR SELECT
TO anon, authenticated
USING (true);
