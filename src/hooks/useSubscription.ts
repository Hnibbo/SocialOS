import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";


export interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  priceId: string | null;
  planName: string | null;
  subscriptionEnd: string | null;
  status: "active" | "trialing" | "canceled" | "expired" | "none";
  provider: "stripe";
}

const defaultStatus: SubscriptionStatus = {
  subscribed: false,
  productId: null,
  priceId: null,
  planName: null,
  subscriptionEnd: null,
  status: "none",
  provider: "stripe",
};

export function useSubscription() {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>(defaultStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user || !session) {
      setSubscription(defaultStatus);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the unified endpoint that handles provider logic
      const { data, error: fetchError } = await supabase.functions.invoke("subscription-status");

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setSubscription({
          subscribed: data.subscribed || false,
          productId: null,
          priceId: null,
          planName: data.plan?.name || null,
          subscriptionEnd: data.currentPeriodEnd || null,
          status: data.status || "none",
          provider: "stripe",
        });
      }
    } catch (err) {
      console.error("Error checking subscription:", err);
      // Don't show toast error on every check as it runs in background
      setError(err instanceof Error ? err.message : "Failed to check subscription");
      setSubscription(defaultStatus);
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    if (user && session) {
      checkSubscription();
    } else {
      setSubscription(defaultStatus);
    }
  }, [user, session, checkSubscription]);

  // Auto-refresh subscription every 5 minutes
  useEffect(() => {
    if (!user || !session) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, session, checkSubscription]);

  return {
    subscription,
    loading,
    error,
    checkSubscription,
    isSubscribed: subscription.subscribed,
    planName: subscription.planName || "Free",
    provider: subscription.provider,
  };
}
