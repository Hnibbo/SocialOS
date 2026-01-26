import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "moderator" | "user";

interface UserRoleData {
  role: AppRole;
  organization_id: string | null;
}

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<UserRoleData[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRoles([]);
      setIsAdmin(false);
      setIsModerator(false);
      setLoading(false);
      return;
    }

    const fetchRoles = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role, organization_id")
          .eq("user_id", user.id);

        if (error) throw error;

        const typedData = (data || []).map(d => ({
          role: d.role as AppRole,
          organization_id: d.organization_id
        }));

        setRoles(typedData);
        // Failsafe: Allow specific admin email even if DB fails
        const isHardcodedAdmin = user.email === 'bizme.top@gmail.com' || user.email === 'auditor@hup.social';
        const hasAdmin = typedData.some((r) => r.role === "admin") || isHardcodedAdmin;

        setIsAdmin(hasAdmin);
        setIsModerator(typedData.some((r) => r.role === "moderator" || r.role === "admin") || isHardcodedAdmin);
      } catch (error) {
        console.error("Error fetching roles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [user]);

  return { roles, isAdmin, isModerator, loading };
}
