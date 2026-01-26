-- Admin Actions for User Management
-- These functions must be called by a Super Admin (service_role or checking user_metadata)

-- 1. Soft Delete / Deactivate
CREATE OR REPLACE FUNCTION admin_deactivate_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin (optional, can be enforcing via RLS or logic)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Admin only';
  END IF;

  -- Soft delete profile
  UPDATE user_profiles
  SET is_visible = false,
      is_suspended = true
  WHERE id = target_user_id;

  -- Terminate sessions implies auth.users update but we can't do that easily from here without pg_net or extensive setup.
  -- RLS policies will handle the rest (user won't be able to query tables).
END;
$$;

-- 2. Ban / Hard Block
CREATE OR REPLACE FUNCTION admin_ban_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
   IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access Denied: Admin only';
  END IF;

  INSERT INTO banned_users (user_id, banned_by, reason)
  VALUES (target_user_id, auth.uid(), 'Admin manual ban')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Also hide profile
  UPDATE user_profiles
  SET is_visible = false
  WHERE id = target_user_id;
END;
$$;
