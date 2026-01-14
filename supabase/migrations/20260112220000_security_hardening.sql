-- Migration: Final Security Hardening & RLS Polish

-- 1. Secure 'banned_users' Table (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'banned_users') THEN
        ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Admins can manage banned users" ON public.banned_users;
        CREATE POLICY "Admins can manage banned users" ON public.banned_users
            USING (public.is_admin())
            WITH CHECK (public.is_admin());

        DROP POLICY IF EXISTS "Users can view if they are banned" ON public.banned_users;
        CREATE POLICY "Users can view if they are banned" ON public.banned_users
            FOR SELECT
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- 2. Fix 'group_invitations' (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'group_invitations') THEN
        DROP POLICY IF EXISTS "Users can see their invitations" ON public.group_invitations;
        CREATE POLICY "Users can see their invitations" ON public.group_invitations
            FOR SELECT
            USING (
                auth.uid() = inviter_id OR 
                auth.uid() = invitee_id
            );

        DROP POLICY IF EXISTS "Admins/Group Owners can create invitations" ON public.group_invitations;
        CREATE POLICY "Admins/Group Owners can create invitations" ON public.group_invitations
            FOR INSERT
            WITH CHECK (
                auth.uid() = inviter_id AND
                EXISTS (
                    SELECT 1 FROM public.group_members 
                    WHERE group_id = public.group_invitations.group_id 
                    AND user_id = auth.uid() 
                    AND role IN ('owner', 'admin')
                )
            );

        DROP POLICY IF EXISTS "Invitee can accept/decline" ON public.group_invitations;
        CREATE POLICY "Invitee can accept/decline" ON public.group_invitations
            FOR UPDATE
            USING (auth.uid() = invitee_id);
    END IF;
END $$;

-- 3. Fix Mutable Search Paths (Security Best Practice)
DO $$
BEGIN
    ALTER FUNCTION public.find_nearby_activities(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) SET search_path = public, extensions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.find_nearby_groups(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) SET search_path = public, extensions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.find_nearby_users(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) SET search_path = public, extensions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Audit Log Policy Fix (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
        CREATE POLICY "Service role can insert audit logs" ON public.audit_logs
            FOR INSERT
            WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;

-- 5. Agent Traces (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_traces') THEN
        DROP POLICY IF EXISTS "Service role can insert traces" ON public.agent_traces;
        CREATE POLICY "Service role can insert traces" ON public.agent_traces
            FOR INSERT
            WITH CHECK (auth.role() = 'service_role');
    END IF;
END $$;
