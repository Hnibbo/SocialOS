-- ULTIMATE CUSTOMIZATION SCHEMA
-- User preferences, themes, and personalization

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- Theme & Appearance
    theme_mode text DEFAULT 'dark', -- dark, light, auto
    theme_color text DEFAULT 'electric', -- electric, ocean, sunset, forest, custom
    custom_primary_color text,
    custom_secondary_color text,
    custom_accent_color text,
    font_family text DEFAULT 'outfit',
    font_size text DEFAULT 'medium', -- small, medium, large, xlarge
    
    -- Layout
    layout_style text DEFAULT 'modern', -- modern, classic, compact, spacious
    sidebar_position text DEFAULT 'left', -- left, right
    show_animations boolean DEFAULT true,
    reduce_motion boolean DEFAULT false,
    
    -- Privacy
    profile_visibility text DEFAULT 'public', -- public, friends, private
    location_sharing text DEFAULT 'precise', -- precise, approximate, off
    online_status_visible boolean DEFAULT true,
    read_receipts_enabled boolean DEFAULT true,
    typing_indicators_enabled boolean DEFAULT true,
    
    -- Notifications
    push_notifications boolean DEFAULT true,
    email_notifications boolean DEFAULT true,
    sms_notifications boolean DEFAULT false,
    notification_sound text DEFAULT 'default',
    vibration_enabled boolean DEFAULT true,
    quiet_hours_start time,
    quiet_hours_end time,
    
    -- Content
    content_language text DEFAULT 'en',
    auto_translate boolean DEFAULT false,
    show_sensitive_content boolean DEFAULT false,
    content_filter_level text DEFAULT 'medium', -- off, low, medium, high
    
    -- Accessibility
    high_contrast boolean DEFAULT false,
    screen_reader_optimized boolean DEFAULT false,
    keyboard_navigation boolean DEFAULT false,
    captions_enabled boolean DEFAULT false,
    
    -- Advanced
    ai_recommendations boolean DEFAULT true,
    data_saver_mode boolean DEFAULT false,
    offline_mode boolean DEFAULT false,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create user_identity table for inclusive identity options
CREATE TABLE IF NOT EXISTS public.user_identity (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- Identity
    pronouns text[], -- Custom pronouns array
    gender_identity text, -- Unlimited custom options
    sexual_orientation text,
    relationship_status text,
    
    -- Background
    ethnicity text[],
    cultural_background text[],
    languages_spoken text[],
    religion text,
    political_views text,
    
    -- Lifestyle
    dietary_preferences text[],
    disabilities text[],
    neurodivergent_status text,
    
    -- Interests (unlimited tags)
    interests jsonb DEFAULT '[]'::jsonb,
    hobbies jsonb DEFAULT '[]'::jsonb,
    
    -- Visibility controls
    pronouns_visible boolean DEFAULT true,
    gender_visible boolean DEFAULT true,
    orientation_visible boolean DEFAULT false,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create custom_themes table
CREATE TABLE IF NOT EXISTS public.custom_themes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name text NOT NULL,
    is_public boolean DEFAULT false,
    
    -- Colors
    primary_color text NOT NULL,
    secondary_color text NOT NULL,
    accent_color text NOT NULL,
    background_color text NOT NULL,
    text_color text NOT NULL,
    
    -- Additional
    border_radius text DEFAULT 'medium',
    shadow_intensity text DEFAULT 'medium',
    
    -- Metadata
    downloads integer DEFAULT 0,
    likes integer DEFAULT 0,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_themes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_identity
CREATE POLICY "Users can view own identity"
ON public.user_identity FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own identity"
ON public.user_identity FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own identity"
ON public.user_identity FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for custom_themes
CREATE POLICY "Users can view own themes"
ON public.custom_themes FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage own themes"
ON public.custom_themes FOR ALL
USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_identity TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_themes TO authenticated;

-- Create indexes
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_identity_user_id ON public.user_identity(user_id);
CREATE INDEX idx_custom_themes_user_id ON public.custom_themes(user_id);
CREATE INDEX idx_custom_themes_public ON public.custom_themes(is_public) WHERE is_public = true;

-- Function to initialize user preferences
CREATE OR REPLACE FUNCTION public.initialize_user_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO public.user_identity (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Trigger to auto-create preferences
CREATE TRIGGER on_user_created_initialize_preferences
AFTER INSERT ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.initialize_user_preferences();
