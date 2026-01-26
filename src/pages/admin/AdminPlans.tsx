import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Crown, Users, Check, Sparkles, Zap, Loader2, RefreshCw, CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import PlanFormDialog from "@/components/admin/PlanFormDialog";
import type { Plan } from "@/hooks/usePlans";

interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  trial_ends_at: string | null;
  users?: { email: string; name: string | null };
  subscription_plans?: { name: string };
}

import { AdminPageHeader } from "@/components/admin/shared/AdminPageHeader";

export default function AdminPlans() {
  const [activeTab, setActiveTab] = useState("plans");
  const [loading, setLoading] = useState(true);

  // Data states
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);

  // Dialog states
  const [planDialogOpen, setPlanDialogOpen] = useState(false);

  // Form states
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "plans") {
        const { data: plansData } = await supabase
          .from("subscription_plans")
          .select("*")
          .order("sort_order");
        const formattedPlans = (plansData || []).map((p) => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : [],
          limits: p.limits || { workspaces: 1, commands_per_day: 100, history_days: 7 },
          is_custom: p.is_custom || false,
          cta_text: p.cta_text || "Subscribe"
        }));
        setPlans(formattedPlans);
      }

      if (activeTab === "subscriptions") {
        const { data: subsData } = await supabase
          .from("user_subscriptions")
          .select("*, users(email, name), subscription_plans(name)")
          .order("created_at", { ascending: false })
          .limit(100);
        setSubscriptions((subsData as UserSubscription[]) || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlanActive = async (plan: Plan) => {
    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_active: !plan.is_active })
      .eq("id", plan.id);

    if (error) {
      toast.error("Failed to update plan");
    } else {
      toast.success(`Plan ${plan.is_active ? "deactivated" : "activated"}`);
      fetchData();
    }
  };

  const togglePlanFeatured = async (plan: Plan) => {
    // If enabling featured, disable it on all other plans first
    if (!plan.is_featured) {
      await supabase
        .from("subscription_plans")
        .update({ is_featured: false })
        .neq("id", plan.id);
    }

    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_featured: !plan.is_featured })
      .eq("id", plan.id);

    if (error) {
      toast.error("Failed to update plan");
    } else {
      toast.success(`Plan ${plan.is_featured ? "unfeatured" : "featured"}`);
      fetchData();
    }
  };

  const deletePlan = async (plan: Plan) => {
    const { error } = await supabase
      .from("subscription_plans")
      .delete()
      .eq("id", plan.id);

    if (error) {
      toast.error("Failed to delete plan. It may have active subscriptions.");
    } else {
      toast.success("Plan deleted");
      fetchData();
    }
  };

  const getPlanIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("enterprise") || lowerName.includes("business")) {
      return Crown;
    }
    if (lowerName.includes("pro") || lowerName.includes("professional")) {
      return Zap;
    }
    return Sparkles;
  };

  const renderActions = () => (
    <div className="flex items-center gap-2">
      {activeTab === "plans" && (
        <>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        </>
      )}
      {activeTab === "subscriptions" && (
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Subscriptions
        </Button>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        <AdminPageHeader
          title="Plans & Billing"
          description="Revenue management, subscription tiers, and Stripe infrastructure control."
          icon={CreditCard}
          actions={renderActions()}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="plans" className="gap-2">
              <Crown className="h-4 w-4" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <Users className="h-4 w-4" />
              Subscriptions
            </TabsTrigger>
            <TabsTrigger value="stripe" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Stripe Sync
            </TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Subscription Plans</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={async () => {
                    const loadingToast = toast.loading("Syncing plans with Stripe...");
                    try {
                      const { data, error } = await supabase.functions.invoke('stripe-admin', {
                        body: { action: 'sync-plans' }
                      });
                      if (error) throw error;
                      toast.success(data.message || "Successfully synced plans with Stripe", { id: loadingToast });
                      fetchData();
                    } catch (err) {
                      toast.error("Failed to sync with Stripe", { id: loadingToast });
                      console.error(err);
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Plans Now
                </Button>
                <Button onClick={() => { setEditingPlan(null); setPlanDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 data-testid="loader" className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                  const Icon = getPlanIcon(plan.name);
                  return (
                    <Card key={plan.id} className={`relative ${plan.is_featured ? "ring-2 ring-primary" : ""}`}>
                      {plan.is_featured && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Badge className="bg-gradient-primary text-white">Featured</Badge>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle>{plan.name}</CardTitle>
                              <CardDescription className="text-xs">{plan.slug}</CardDescription>
                            </div>
                          </div>
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                        <div>
                          <p className="text-2xl font-bold">
                            ${plan.price_monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${plan.price_yearly}/year
                          </p>
                        </div>
                        {plan.trial_days > 0 && (
                          <Badge variant="outline">{plan.trial_days} day trial</Badge>
                        )}
                        <ul className="text-sm space-y-1">
                          {(plan.features as string[]).slice(0, 4).map((feature, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className="h-3 w-3 text-success" />
                              {feature}
                            </li>
                          ))}
                          {plan.features.length > 4 && (
                            <li className="text-muted-foreground text-xs">+{plan.features.length - 4} more</li>
                          )}
                        </ul>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditingPlan(plan); setPlanDialogOpen(true); }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => togglePlanActive(plan)}
                          >
                            {plan.is_active ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            size="sm"
                            variant={plan.is_featured ? "secondary" : "default"}
                            onClick={() => togglePlanFeatured(plan)}
                          >
                            {plan.is_featured ? "Unfeature" : "Feature"}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Plan?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the "{plan.name}" plan. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePlan(plan)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {plans.length === 0 && (
                  <Card className="col-span-full">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No plans yet. Create your first subscription plan!
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <PlanFormDialog
              open={planDialogOpen}
              onOpenChange={setPlanDialogOpen}
              plan={editingPlan}
              onSuccess={() => {
                setPlanDialogOpen(false);
                fetchData();
              }}
            />
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Subscriptions</CardTitle>
                <CardDescription>Latest user subscriptions and status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="p-3 font-medium">User</th>
                        <th className="p-3 font-medium">Plan</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 font-medium">Started</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((sub) => (
                        <tr key={sub.id} className="border-t border-border">
                          <td className="p-3">
                            <div className="font-medium">{sub.users?.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{sub.users?.email}</div>
                          </td>
                          <td className="p-3">{sub.subscription_plans?.name || "Unknown Plan"}</td>
                          <td className="p-3">
                            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                              {sub.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {new Date(sub.started_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {subscriptions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground">No subscriptions found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stripe" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stripe Infrastructure</CardTitle>
                <CardDescription>Verify your Stripe products and prices are synced</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  The platform is now fully migrated to Stripe. Use the "Refresh" button in the Plans tab
                  to sync the latest data from the database.
                </p>
                <Button
                  onClick={() => window.open('https://dashboard.stripe.com/products', '_blank')}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage on Stripe
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
