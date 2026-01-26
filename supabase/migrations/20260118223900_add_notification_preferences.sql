-- Add notification preferences to user_preferences table
-- This migration adds fields for detailed notification type preferences

ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS enable_push_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sound boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_vibrate boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_types jsonb DEFAULT '{
  "likes": true,
  "comments": true,
  "follows": true,
  "mentions": true,
  "messages": true,
  "shares": true,
  "views": true,
  "system": true,
  "marketing": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS email_notification_types jsonb DEFAULT '{
  "daily_digest": true,
  "weekly_summary": false,
  "important_updates": true,
  "marketing": false
}'::jsonb;



-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_push_notifications ON public.user_preferences(enable_push_notifications);
CREATE INDEX IF NOT EXISTS idx_user_preferences_email_notifications ON public.user_preferences(enable_email_notifications);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.user_preferences TO authenticated;

-- Ensure RLS policies are still in place
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Verify the changes
SELECT COUNT(*) as total_records,
       COUNT(*) FILTER (WHERE enable_push_notifications = true) as push_enabled,
       COUNT(*) FILTER (WHERE enable_email_notifications = true) as email_enabled
FROM public.user_preferences;
