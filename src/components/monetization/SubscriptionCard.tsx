import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price_monthly: number;
    features: Record<string, boolean>;
    is_popular: boolean;
}

interface SubscriptionCardProps {
    plan: SubscriptionPlan;
    currentPlanId?: string;
    onSubscribe: (planId: string) => void;
}

export function SubscriptionCard({ plan, currentPlanId, onSubscribe }: SubscriptionCardProps) {
    const isCurrent = currentPlanId === plan.id;

    const handleSubscribe = async () => {
        try {
            if (isCurrent) return;

            const { data, error } = await supabase.functions.invoke('stripe-checkout', {
                body: { planId: plan.id }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            toast.error('Failed to start checkout');
        }
    };

    return (
        <Card className={cn(
            "flex flex-col relative overflow-hidden transition-all hover:border-primary/50",
            isCurrent && "border-primary shadow-lg shadow-primary/10",
            plan.is_popular && !isCurrent && "border-yellow-500/50"
        )}>
            {plan.is_popular && (
                <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-yellow-500 text-black font-bold">
                        POPULAR
                    </Badge>
                </div>
            )}

            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 space-y-6">
                <div className="text-3xl font-bold">
                    ${plan.price_monthly}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </div>

                <div className="space-y-2 text-sm">
                    {Object.entries(plan.features).map(([feature, includes]) => (
                        <div key={feature} className="flex items-center gap-2">
                            {String(includes) === 'true' ? (
                                <Check className="w-4 h-4 text-green-500" />
                            ) : (
                                <X className="w-4 h-4 text-muted-foreground/30" />
                            )}
                            <span className={cn(!includes && "text-muted-foreground line-through decoration-muted-foreground/30")}>
                                {feature.replace(/_/g, ' ')}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>

            <CardFooter>
                <Button
                    className="w-full"
                    variant={isCurrent ? "outline" : "default"}
                    onClick={handleSubscribe}
                    disabled={isCurrent}
                >
                    {isCurrent ? "Current Plan" : "Subscribe"}
                </Button>
            </CardFooter>
        </Card>
    );
}
