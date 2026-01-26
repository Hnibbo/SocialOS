import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type OrganizationRole = "owner" | "admin" | "member";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  custom_domain: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OrganizationSettings {
  id: string;
  organization_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface OrganizationSubscription {
  id: string;
  organization_id: string;
  plan_id: string | null;
  status: string;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useOrganizations() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  // Fetch user's organizations
  const fetchOrganizations = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First, find all organizations the user is part of
      const { data: userRoles, error: rolesError } = await supabase
        .from("organization_roles")
        .select("organization_id")
        .eq("user_id", user.id);

      if (rolesError) throw rolesError;

      if (userRoles.length === 0) {
        setOrganizations([]);
        setCurrentOrg(null);
        return;
      }

      const orgIds = userRoles.map(role => role.organization_id);

      // Fetch organization details
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("*")
        .in("id", orgIds)
        .order("created_at", { ascending: false });

      if (orgsError) throw orgsError;

      setOrganizations(orgs || []);
      
      // Set first organization as current if none is selected
      if (!currentOrg && orgs.length > 0) {
        setCurrentOrg(orgs[0]);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast.error("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  }, [user, currentOrg]);

  // Fetch organization settings
  const fetchOrganizationSettings = useCallback(async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from("organization_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data || null;
    } catch (error) {
      console.error("Error fetching organization settings:", error);
      toast.error("Failed to fetch organization settings");
      return null;
    }
  }, []);

  // Fetch organization subscription
  const fetchOrganizationSubscription = useCallback(async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from("organization_subscriptions")
        .select("*")
        .eq("organization_id", organizationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data || null;
    } catch (error) {
      console.error("Error fetching organization subscription:", error);
      toast.error("Failed to fetch organization subscription");
      return null;
    }
  }, []);

  // Update organization settings
  const updateOrganizationSettings = useCallback(async (organizationId: string, settings: Record<string, any>) => {
    try {
      const { data, error } = await supabase
        .from("organization_settings")
        .upsert({
          organization_id: organizationId,
          settings: settings
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Organization settings updated");
      return data;
    } catch (error) {
      console.error("Error updating organization settings:", error);
      toast.error("Failed to update organization settings");
      return null;
    }
  }, []);

  // Update organization details
  const updateOrganization = useCallback(async (organizationId: string, updates: Partial<Organization>) => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", organizationId)
        .select()
        .single();

      if (error) throw error;

      setOrganizations(organizations.map(org => 
        org.id === organizationId ? { ...org, ...data } : org
      ));

      if (currentOrg?.id === organizationId) {
        setCurrentOrg(prev => prev ? { ...prev, ...data } : null);
      }

      toast.success("Organization updated");
      return data;
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("Failed to update organization");
      return null;
    }
  }, [organizations, currentOrg]);

  // Switch current organization
  const switchOrganization = useCallback((organizationId: string) => {
    const org = organizations.find(o => o.id === organizationId);
    if (org) {
      setCurrentOrg(org);
      // You might want to store this in local storage or cookies for persistence
      localStorage.setItem("current_organization_id", organizationId);
    }
  }, [organizations]);

  // Initialize
  useEffect(() => {
    if (user) {
      fetchOrganizations();
      
      // Check if we have a stored organization ID
      const storedOrgId = localStorage.getItem("current_organization_id");
      if (storedOrgId) {
        setCurrentOrg(prev => {
          if (!prev || prev.id !== storedOrgId) {
            return organizations.find(o => o.id === storedOrgId) || null;
          }
          return prev;
        });
      }
    }
  }, [user, fetchOrganizations]);

  return {
    organizations,
    currentOrg,
    loading,
    fetchOrganizations,
    fetchOrganizationSettings,
    fetchOrganizationSubscription,
    updateOrganizationSettings,
    updateOrganization,
    switchOrganization
  };
}
