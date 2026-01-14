import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { ElectricButton } from '@/components/ui/electric-button';
import { Check, Zap, Crown, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_PLANS, createCheckoutSession } from '@/lib/stripe-service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const PricingSection: React.FC = () => {
    const [loading, setLoading] = useState<string | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleSubscribe = async (priceId: string, planId: string) => {
        if (!user) {
            toast({
                title: 'Authentication Required',
                description: 'Please sign in to subscribe',
                variant: 'destructive',
            });
            return;
        }

        setLoading(planId);
        try {
            const sessionId = await createCheckoutSession(priceId, user.id);
            // Redirect to Stripe Checkout
            const stripe = (window as any).Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
            await stripe.redirectToCheckout({ sessionId });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to start checkout. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setLoading(null);
        }
    };

    const getPlanIcon = (planId: string) => {
        switch (planId) {
            case 'pro':
                return <Zap className="w-8 h-8 text-primary" />;
            case 'elite':
                return <Crown className="w-8 h-8 text-accent" />;
            default:
                return <Sparkles className="w-8 h-8 text-secondary" />;
        }
    };

    return (
        <section className="py-20 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16 animate-slide-up">
                    <h2 className="text-5xl font-bold mb-4 text-gradient-electric">
                        Choose Your Power Level
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Unlock premium features and dominate the social landscape
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {SUBSCRIPTION_PLANS.map((plan, index) => (
                        <GlassCard
                            key={plan.id}
                            className={`p-8 relative ${plan.popular ? 'border-primary shadow-[0_0_50px_rgba(0,240,255,0.3)]' : ''}`}
                            hover
                            glow={plan.popular}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary px-4 py-1 rounded-full text-dark font-semibold text-sm">
                                    Most Popular
                                </div>
                            )}

                            {/* Icon */}
                            <div className="mb-6 flex justify-center">
                                {getPlanIcon(plan.id)}
                            </div>

                            {/* Plan Name */}
                            <h3 className="text-2xl font-bold text-center mb-2">
                                {plan.name}
                            </h3>

                            {/* Description */}
                            <p className="text-muted-foreground text-center mb-6">
                                {plan.description}
                            </p>

                            {/* Price */}
                            <div className="text-center mb-8">
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-bold text-gradient-electric">
                                        ${plan.price}
                                    </span>
                                    {plan.price > 0 && (
                                        <span className="text-muted-foreground">/{plan.interval}</span>
                                    )}
                                </div>
                            </div>

                            {/* Features */}
                            <ul className="space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <ElectricButton
                                variant={plan.popular ? 'primary' : 'secondary'}
                                className="w-full"
                                glow={plan.popular}
                                disabled={loading === plan.id || plan.price === 0}
                                onClick={() => handleSubscribe(plan.stripePriceId, plan.id)}
                            >
                                {loading === plan.id ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : plan.price === 0 ? (
                                    'Current Plan'
                                ) : (
                                    'Get Started'
                                )}
                            </ElectricButton>
                        </GlassCard>
                    ))}
                </div>

                {/* Trust Indicators */}
                <div className="mt-16 text-center text-sm text-muted-foreground">
                    <p>🔒 Secure payment powered by Stripe • Cancel anytime • 30-day money-back guarantee</p>
                </div>
            </div>
        </section>
    );
};
