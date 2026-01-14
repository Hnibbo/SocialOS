import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Zap, Crown, Check, ArrowRight, Loader2, Clock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { usePlans, Plan } from "@/hooks/usePlans";
import { motion } from "framer-motion";

export default function Billing() {
    const { plans, loading: plansLoading } = usePlans({ activeOnly: true });
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('user_subscriptions')
            .select('*, subscription_plans(*)')
            .eq('user_id', user.id)
            .maybeSingle();

        setSubscription(data);
        setLoading(false);
    };

    const handleUpgrade = async (plan: Plan) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Please login to upgrade");
            return;
        }

        try {
            const { data, error } = await supabase.functions.invoke('stripe-admin', {
                body: {
                    action: 'create-checkout',
                    priceId: plan.stripe_price_monthly,
                    userId: user.id,
                    successUrl: window.location.origin + '/dashboard/billing?success=true',
                    cancelUrl: window.location.origin + '/dashboard/billing?canceled=true'
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            toast.error("Failed to start checkout");
            console.error(err);
        }
    };

    const handleManagePortal = async () => {
        try {
            // Note: We need the stripe_customer_id which should be in the user profile or subscription
            // For now we use the user id and the function should handle lookup or we add it to the params
            const { data, error } = await supabase.functions.invoke('stripe-admin', {
                body: {
                    action: 'create-portal',
                    returnUrl: window.location.origin + '/dashboard/billing'
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (_err) {
            toast.error("Failed to open billing portal");
        }
    };

    if (loading || plansLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tighter">Billing & Subscription</h1>
                <p className="text-muted-foreground text-lg">Manage your node capacity and elite features.</p>
            </div>

            {subscription && (
                <Card className="border-primary/20 bg-primary/5 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                Current Plan: <span className="text-primary">{subscription.subscription_plans?.name}</span>
                                <Badge className="bg-success text-white">Active</Badge>
                            </CardTitle>
                            <CardDescription>
                                Next billing date: {new Date(subscription.expires_at).toLocaleDateString()}
                            </CardDescription>
                        </div>
                        <Button variant="outline" onClick={handleManagePortal}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Manage Billing
                        </Button>
                    </CardHeader>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan, i) => (
                    <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className={`relative flex flex-col h-full ${plan.is_featured ? 'border-primary ring-1 ring-primary/50' : ''}`}>
                            {plan.is_featured && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-white">Recommended</Badge>
                                </div>
                            )}
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-2">
                                    {plan.name.toLowerCase().includes('pro') ? <Zap className="text-primary h-5 w-5" /> : <Crown className="text-amber-500 h-5 w-5" />}
                                    <CardTitle>{plan.name}</CardTitle>
                                </div>
                                <CardDescription>{plan.description}</CardDescription>
                                <div className="pt-4">
                                    <span className="text-4xl font-black tracking-tighter">${plan.price_monthly}</span>
                                    <span className="text-muted-foreground text-sm font-medium">/month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm">
                                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Check className="h-3 w-3 text-primary" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <div className="pt-4 border-t border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {plan.limits.commands_per_day} daily commands
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <ShieldCheck className="w-3 h-3" />
                                        {plan.limits.history_days} days history
                                    </div>
                                </div>
                            </CardContent>
                            <div className="p-6 pt-0 mt-auto">
                                <Button
                                    className="w-full h-12 rounded-xl font-bold"
                                    variant={plan.is_featured ? 'default' : 'outline'}
                                    disabled={subscription?.plan_id === plan.id}
                                    onClick={() => handleUpgrade(plan)}
                                >
                                    {subscription?.plan_id === plan.id ? 'Current Plan' : 'Select Plan'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
