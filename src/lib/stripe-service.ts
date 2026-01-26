
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

// Initialize Stripe with production key
const stripePromise = loadStripe('pk_live_51SL5K4BsDHqQr7fhG5iZwQjmVUbUrA90NTduBHZRY8IkLxO4at6N4wZRZikFOMJjrm9kQrKBBjUxlom7oyiogiXp00vBMHVSDs');

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    interval: 'month' | 'year';
    features: string[];
    stripePriceId: string;
    popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Free',
        description: 'Get started with basic features',
        price: 0,
        interval: 'month',
        stripePriceId: '',
        features: [
            'Basic map access',
            'Limited matches per day',
            'Standard profile',
            'Community features',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Unlock premium features',
        price: 9.99,
        interval: 'month',
        stripePriceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID || '',
        popular: true,
        features: [
            'Unlimited matches',
            'Advanced filters',
            'Priority support',
            'Verified badge',
            'Ad-free experience',
            'Live streaming',
        ],
    },
    {
        id: 'elite',
        name: 'Elite',
        description: 'Everything you need to dominate',
        price: 29.99,
        interval: 'month',
        stripePriceId: import.meta.env.VITE_STRIPE_ELITE_MONTHLY_PRICE_ID || '',
        features: [
            'All Pro features',
            'Exclusive events',
            'VIP badge',
            'Personal concierge',
            'Early access to features',
            'Custom profile themes',
            'Analytics dashboard',
        ],
    },
];

export async function createCheckoutSession(priceId: string, userId: string) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                priceId,
                userId,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const { url } = await response.json();
        return url;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

export async function createPortalSession(customerId: string) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-portal`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                userId: customerId,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create portal session');
        }

        const { url } = await response.json();
        return url;
    } catch (error) {
        console.error('Error creating portal session:', error);
        throw error;
    }
}

export async function getCurrentSubscription(userId: string) {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('subscription_tier, subscription_status, subscription_expires')
            .eq('id', userId)
            .single();

        if (error) throw error;

        if (!data) {
            return {
                tier: 'free',
                status: 'inactive',
                endDate: null,
            };
        }

        return {
            tier: data.subscription_tier || 'free',
            status: data.subscription_status || 'inactive',
            endDate: data.subscription_expires ? new Date(data.subscription_expires) : null,
        };
    } catch (error) {
        console.error('Error fetching subscription:', error);
        return {
            tier: 'free',
            status: 'inactive',
            endDate: null,
        };
    }
}
