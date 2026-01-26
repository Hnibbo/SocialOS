import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PerformanceMonitor } from "@/lib/utils/performance";

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    workspaces: number;
    commands_per_day: number;
    history_days: number;
  };
  is_active: boolean;
  is_featured: boolean;
  trial_days: number;
  sort_order: number;
  stripe_price_monthly?: string | null;
  stripe_price_yearly?: string | null;
  stripe_product_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface UsePlansOptions {
  activeOnly?: boolean;
}

export function usePlans(options: UsePlansOptions = {}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await PerformanceMonitor.trackApiCall('fetchPlans', async () => {
        let query = supabase
          .from("subscription_plans")
          .select("*")
          .order("sort_order");

        if (options.activeOnly) {
          query = query.eq("is_active", true);
        }
        return await query;
      });

      if (fetchError) {
        throw fetchError;
      }

      const formattedPlans: Plan[] = (data || []).map((p) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
        limits: p.limits || { workspaces: 1, commands_per_day: 100, history_days: 7 },
      }));

      setPlans(formattedPlans);
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch plans");
    } finally {
      setLoading(false);
    }
  }, [options.activeOnly]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, loading, error, refetch: fetchPlans };
}

// Get a plan icon based on name
export function getPlanIcon(name: string) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("enterprise") || lowerName.includes("business")) {
    return "crown";
  }
  if (lowerName.includes("pro") || lowerName.includes("professional")) {
    return "zap";
  }
  return "sparkles";
}

// Get gradient class based on plan
export function getPlanGradient(name: string) {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("enterprise") || lowerName.includes("business")) {
    return "from-amber-500 to-orange-500";
  }
  if (lowerName.includes("pro") || lowerName.includes("professional")) {
    return "from-primary to-accent";
  }
  return "from-gray-500 to-gray-600";
}
