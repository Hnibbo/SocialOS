import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ExternalLink, Loader2, Rocket, Landmark, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CreatorPortal() {
    const [loading, setLoading] = useState(true);
    const [account, setAccount] = useState<any>(null);

    useEffect(() => {
        fetchAccountStatus();
    }, []);

    const fetchAccountStatus = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('stripe-connect', {
                body: { action: 'get-account-status' }
            });
            if (error) throw error;
            setAccount(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOnboard = async () => {
        const loadingToast = toast.loading("Preparing onboarding...");
        try {
            const { data, error } = await supabase.functions.invoke('stripe-connect', {
                body: {
                    action: 'create-connect-account',
                    refreshUrl: window.location.href,
                    returnUrl: window.location.href
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            toast.error("Failed to start onboarding", { id: loadingToast });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const isActive = account?.status === 'active';

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black tracking-tighter">Creator Portal</h1>
                <p className="text-muted-foreground text-lg">Monetize your influence and receive payouts directly.</p>
            </div>

            {!account || account.status === 'not_created' ? (
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                            <Rocket className="text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Start Earning</CardTitle>
                        <CardDescription className="text-base text-balance">
                            Connect your bank account via Stripe to receive payouts for referrals, content, and events.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button size="lg" className="rounded-2xl font-bold h-14 px-8" onClick={handleOnboard}>
                            Setup Payouts
                            <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    <Card className={`border-l-4 ${isActive ? 'border-l-success' : 'border-l-warning'}`}>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Account Status:
                                    {isActive ? (
                                        <Badge className="bg-success text-white">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Pending Verification</Badge>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {isActive ? 'Your account is ready for payouts.' : 'Complete your profile on Stripe to enable payouts.'}
                                </CardDescription>
                            </div>
                            <Button variant="outline" onClick={handleOnboard}>
                                Stripe Dashboard
                                <ExternalLink className="w-4 h-4 ml-2" />
                            </Button>
                        </CardHeader>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <Landmark className="w-4 h-4" />
                                    <span className="text-xs uppercase font-bold tracking-widest">Available Balance</span>
                                </div>
                                <CardTitle className="text-4xl font-black">$0.00</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full rounded-xl font-bold" disabled>
                                    Payout Now
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-xs uppercase font-bold tracking-widest">Total Earned</span>
                                </div>
                                <CardTitle className="text-4xl font-black">$0.00</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Lifetime earnings across all nodes.</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="bg-white/5 border-white/10">
                        <CardHeader>
                            <CardTitle className="text-lg">Capabilities</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Payouts Enabled</span>
                                {account.payouts_enabled ? <CheckCircle2 className="text-success w-5 h-5" /> : <AlertCircle className="text-warning w-5 h-5" />}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Identity Verified</span>
                                {account.details_submitted ? <CheckCircle2 className="text-success w-5 h-5" /> : <AlertCircle className="text-warning w-5 h-5" />}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
