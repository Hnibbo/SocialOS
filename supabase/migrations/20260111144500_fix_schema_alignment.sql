-- Fix Schema Alignment (Missing Columns) and RLS Friction (Absolute Final Version)

-- 1. Ensure ALL potential missing columns exist on user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Populate Data safely
-- Ensure full_name has something (fallback to email or username)
UPDATE public.user_profiles 
SET full_name = COALESCE(full_name, split_part(email, '@', 1), 'User')
WHERE full_name IS NULL OR full_name = '';

-- Backfill first_name/last_name from full_name
UPDATE public.user_profiles 
SET 
  first_name = split_part(full_name, ' ', 1),
  last_name = CASE 
    WHEN array_length(string_to_array(full_name, ' '), 1) > 1 
    THEN substring(full_name from position(' ' in full_name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL OR first_name = '';

-- Backfill username if missing
UPDATE public.user_profiles
SET username = split_part(email, '@', 1)
WHERE username IS NULL OR username = '';

-- 3. Recreate 'profiles' view (Drop first to avoid column mismatch errors)
DROP VIEW IF EXISTS public.profiles;

CREATE OR REPLACE VIEW public.profiles AS
SELECT 
  id,
  updated_at,
  username,
  full_name,
  first_name,
  last_name,
  avatar_url,
  website,
  api_token,
  birth_date,
  bio
FROM public.user_profiles;

-- 4. Fix User Presence Policies (Simplify to avoid 406/409)
DROP POLICY IF EXISTS "Users can manage own presence" ON public.user_presence;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.user_presence;
-- Permissive policy for authenticated users covering all actions including upsert
CREATE POLICY "Enable all access for authenticated users" ON public.user_presence FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 5. Fix Groups Policies
DROP POLICY IF EXISTS "Public read groups" ON public.groups;
DROP POLICY IF EXISTS "Enable read access for all" ON public.groups;
DROP POLICY IF EXISTS "Authenticated create groups" ON public.groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Creator manage groups" ON public.groups;
DROP POLICY IF EXISTS "Enable update for creators" ON public.groups;

CREATE POLICY "Enable read access for all" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for creators" ON public.groups FOR UPDATE USING (auth.uid() = creator_id);

-- 6. Grant Permissions Again (Just in case)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_presence TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;
