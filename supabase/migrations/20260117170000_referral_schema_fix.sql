-- SOCIAL OS: REFERRAL SYSTEM ENHANCEMENTS (IDEMPOTENT)
-- Adding referral codes to user profiles and automating generation

-- 1. Add referral_code to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- 2. Function to generate a unique referral code
CREATE OR REPLACE FUNCTION public.generate_unique_referral_code()
RETURNS text AS $$
DECLARE
    new_code text;
    done bool;
BEGIN
    done := false;
    WHILE NOT done LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 8));
        IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE referral_code = new_code) THEN
            done := true;
        END IF;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- 3. Trigger to auto-assign referral code on signup
CREATE OR REPLACE FUNCTION public.on_profile_created_assign_referral()
RETURNS trigger AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        NEW.referral_code := public.generate_unique_referral_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_assign_referral_on_signup ON public.user_profiles;
CREATE TRIGGER tr_assign_referral_on_signup
BEFORE INSERT ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.on_profile_created_assign_referral();

-- 4. Backfill existing users
UPDATE public.user_profiles 
SET referral_code = public.generate_unique_referral_code() 
WHERE referral_code IS NULL;

-- 5. Re-create the profiles view safely
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        -- Re-run the view definition to ensure it picks up new columns from the underlying table
        -- We just use SELECT * which will now include the new column exactly once
        DROP VIEW IF EXISTS public.profiles CASCADE;
        CREATE VIEW public.profiles AS SELECT * FROM public.user_profiles;
        
        -- Restore grants (standard for profiles view)
        GRANT SELECT ON public.profiles TO anon, authenticated;
    END IF;
END $$;
