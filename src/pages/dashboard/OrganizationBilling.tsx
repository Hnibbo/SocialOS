import { useState, useEffect } from "react";
import {
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
  Shield,
  CheckCircle2,
  ArrowRight,
  Download
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: "month" | "year";
  features: string[];
}

const plans: SubscriptionPlan[] = [
  {
    id: "1",
    name: "Free",
    description: "Perfect for small teams just getting started",
    price: 0,
    interval: "month",
    features: [
      "Up to 5 team members",
      "Basic support",
      "1GB storage",
      "Community forum access"
    ]
  },
  {
    id: "2",
    name: "Pro",
    description: "For growing organizations with advanced needs",
    price: 29,
    interval: "month",
    features: [
      "Up to 50 team members",
      "Priority support",
      "10GB storage",
      "Custom branding",
      "Advanced analytics"
    ]
  },
  {
    id: "3",
    name: "Enterprise",
    description: "For large organizations with complex requirements",
    price: 99,
    interval: "month",
    features: [
      "Unlimited team members",
      "24/7 support",
      "Unlimited storage",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee"
    ]
  }
];

export default function OrganizationBilling() {
  const { user } = useAuth();
  const { currentOrg, fetchOrganizationSubscription } = useOrganizations();
  const { plans: availablePlans, loading: plansLoading } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;

    const loadData = async () => {
      setLoading(true);
      
      // Load subscription
      const orgSubscription = await fetchOrganizationSubscription(currentOrg.id);
      setSubscription(orgSubscription);

      // Load invoices (mock data for now)
      setInvoices([
        {
          id: "inv_12345",
          date: "2024-01-01",
          amount: 29,
          status: "paid",
          pdf_url: "#"
        },
        {
          id: "inv_12346",
          date: "2024-02-01",
          amount: 29,
          status: "paid",
          pdf_url: "#"
        }
      ]);

      // Load payment methods (mock data for now)
      setPaymentMethods([
        {
          id: "pm_12345",
          type: "Visa",
          last4: "4242",
          expiry: "12/25",
          is_default: true
        }
      ]);

      setLoading(false);
    };

    loadData();
  }, [currentOrg, fetchOrganizationSubscription]);

  const handleChangePlan = async (planId: string) => {
    setIsUpdatingPlan(true);
    try {
      // This would typically integrate with Stripe or your payment provider
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast.success("Plan updated successfully");
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Failed to update plan");
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? This will take effect at the end of your billing period.")) {
      return;
    }

    try {
      // This would typically integrate with Stripe or your payment provider
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      toast.success("Subscription cancelled");
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription");
    }
  };

  const currentPlan = plans.find(p => p.id === subscription?.plan_id) || plans[0];

  if (loading || plansLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="text-center py-12">
        <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Organization Selected</h2>
        <p className="text-muted-foreground">Please join or create an organization to access billing</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Billing & Subscriptions</h1>
          <p className="text-muted-foreground">Manage your organization's billing and subscription</p>
        </div>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Current Plan: {currentPlan.name}
              </CardTitle>
              <CardDescription>
                {subscription?.status === "active" ? "Your subscription is active" : "Your subscription is inactive"}
              </CardDescription>
            </div>
            {subscription?.status && (
              <Badge variant={subscription.status === "active" ? "default" : "destructive"}>
                {subscription.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Billing Cycle</p>
              <p className="text-lg font-semibold">Monthly</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Next Billing Date</p>
              <p className="text-lg font-semibold">
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Total Members</p>
              <p className="text-lg font-semibold">12</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xl font-bold">${currentPlan.price}{currentPlan.price > 0 ? "/month" : ""}</span>
            </div>
            {currentPlan.id !== "1" && (
              <Button variant="destructive" size="sm" onClick={handleCancelSubscription}>
                Cancel Subscription
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Change Your Plan</CardTitle>
          <CardDescription>
            Upgrade or downgrade your plan to fit your needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-6 transition-all ${
                  currentPlan.id === plan.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {currentPlan.id === plan.id && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                    Current
                  </Badge>
                )}
                
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className="w-full"
                  disabled={currentPlan.id === plan.id || isUpdatingPlan}
                  onClick={() => handleChangePlan(plan.id)}
                >
                  {currentPlan.id === plan.id ? "Current Plan" : "Select Plan"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage your payment methods for subscription billing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-md">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{method.type} ending in {method.last4}</p>
                    <p className="text-sm text-muted-foreground">Expires {method.expiry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.is_default && <Badge variant="outline">Default</Badge>}
                  <Button variant="ghost" size="sm">Edit</Button>
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full">
              Add Payment Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            View and download your billing invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-md">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Invoice {invoice.id}</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">${invoice.amount}</p>
                    <Badge variant={invoice.status === "paid" ? "default" : "destructive"} className="text-xs">
                      {invoice.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
