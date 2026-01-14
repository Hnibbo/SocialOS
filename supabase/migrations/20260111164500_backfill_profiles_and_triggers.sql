-- Migration to Backfill Profiles and Setup Triggers
-- Handles: Missing user_profiles for existing auth.users (Fixes 409/FK errors)

-- 0. Ensure email column exists on user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 1. Backfill user_profiles from auth.users
-- This inserts a profile for any user that doesn't have one yet.
INSERT INTO public.user_profiles (id, email, username, full_name, avatar_url, updated_at)
SELECT 
    au.id,
    au.email,
    -- Generate a temporary username if metadata doesn't have one
    COALESCE(
        au.raw_user_meta_data->>'username', 
        split_part(au.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)
    ),
    -- Use metadata name or fallback
    COALESCE(
        au.raw_user_meta_data->>'full_name', 
        au.raw_user_meta_data->>'name',
        split_part(au.email, '@', 1)
    ),
    -- Avatar URL from metadata or default
    COALESCE(
        au.raw_user_meta_data->>'avatar_url',
        'https://ui-avatars.com/api/?name=' || COALESCE(au.raw_user_meta_data->>'name', 'User')
    ),
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.id = au.id
);

-- 2. Create Function to Handle New User Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, username, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(
            new.raw_user_meta_data->>'username',
            split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 4)
        ),
        COALESCE(
            new.raw_user_meta_data->>'full_name',
            new.raw_user_meta_data->>'name',
            split_part(new.email, '@', 1)
        ),
        COALESCE(
            new.raw_user_meta_data->>'avatar_url',
            'https://ui-avatars.com/api/?name=' || COALESCE(new.raw_user_meta_data->>'name', 'User')
        )
    )
    ON CONFLICT (id) DO NOTHING; -- Handle race conditions safely
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create Trigger (Drop first to avoid duplicates)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Ensure RLS allows the trigger to work (Security Definer handles it, but good to be safe)
-- (Already handled by SECURITY DEFINER in function)
