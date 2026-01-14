-- 1. Create Matches Table
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user1_id, user2_id)
);

-- RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see own matches" ON public.matches
    FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 2. Trigger for Mutual Like
CREATE OR REPLACE FUNCTION check_for_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if counter-swipe exists (Right or Super only)
    IF (NEW.direction IN ('right', 'super')) THEN
        IF EXISTS (
            SELECT 1 FROM dating_swipes 
            WHERE swiper_id = NEW.swiped_id 
            AND swiped_id = NEW.swiper_id 
            AND direction IN ('right', 'super')
        ) THEN
            -- INSERT MATCH
            INSERT INTO public.matches (user1_id, user2_id)
            VALUES (LEAST(NEW.swiper_id, NEW.swiped_id), GREATEST(NEW.swiper_id, NEW.swiped_id))
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_swipe_match
    AFTER INSERT ON public.dating_swipes
    FOR EACH ROW
    EXECUTE FUNCTION check_for_match();

-- 3. Trigger for User Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Also init wallet
  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0.00);
  
  -- Also init dating profile (hidden by default)
  INSERT INTO public.dating_profiles (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists first or just recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
