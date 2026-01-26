import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const signature = req.headers.get('stripe-signature');
        if (!signature) {
            throw new Error('No signature provided');
        }

        const body = await req.text();
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

        if (!webhookSecret) {
            throw new Error('Webhook secret not configured');
        }

        // Verify webhook signature
        const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

        console.log('Webhook event received:', event.type);

        // Handle different event types
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                await handleCheckoutCompleted(session);
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                await handleSubscriptionUpdate(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await handleSubscriptionDeleted(subscription);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                await handlePaymentSucceeded(invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                await handlePaymentFailed(invoice);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (err) {
        console.error('Webhook error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});

async function handleCheckoutCompleted(session: any) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/update_user_subscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
            p_user_id: session.client_reference_id,
            p_stripe_customer_id: session.customer,
            p_stripe_subscription_id: session.subscription,
            p_tier: getTierFromPriceId(session.line_items?.data[0]?.price?.id),
            p_status: 'active',
            p_start: new Date().toISOString(),
            p_end: null,
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to update subscription in database');
    }

    // Log event
    await logSubscriptionEvent(session.client_reference_id, 'checkout_completed', session);
}

async function handleSubscriptionUpdate(subscription: any) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const userId = subscription.metadata?.user_id;
    if (!userId) return;

    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/update_user_subscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
            p_user_id: userId,
            p_stripe_customer_id: subscription.customer,
            p_stripe_subscription_id: subscription.id,
            p_tier: getTierFromPriceId(subscription.items.data[0].price.id),
            p_status: subscription.status,
            p_start: new Date(subscription.current_period_start * 1000).toISOString(),
            p_end: currentPeriodEnd.toISOString(),
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to update subscription');
    }

    await logSubscriptionEvent(userId, 'subscription_updated', subscription);
}

async function handleSubscriptionDeleted(subscription: any) {
    const userId = subscription.metadata?.user_id;
    if (!userId) return;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/update_user_subscription`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
            p_user_id: userId,
            p_stripe_customer_id: subscription.customer,
            p_stripe_subscription_id: subscription.id,
            p_tier: 'free',
            p_status: 'canceled',
            p_start: null,
            p_end: new Date().toISOString(),
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to cancel subscription');
    }

    await logSubscriptionEvent(userId, 'subscription_canceled', subscription);
}

async function handlePaymentSucceeded(invoice: any) {
    const userId = invoice.subscription_details?.metadata?.user_id;
    if (!userId) return;

    await logSubscriptionEvent(userId, 'payment_succeeded', {
        amount: invoice.amount_paid,
        currency: invoice.currency,
        invoice_id: invoice.id,
    });
}

async function handlePaymentFailed(invoice: any) {
    const userId = invoice.subscription_details?.metadata?.user_id;
    if (!userId) return;

    await logSubscriptionEvent(userId, 'payment_failed', {
        amount: invoice.amount_due,
        currency: invoice.currency,
        invoice_id: invoice.id,
    });
}

async function logSubscriptionEvent(userId: string, eventType: string, metadata: any) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    await fetch(`${supabaseUrl}/rest/v1/subscription_events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey!,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
            user_id: userId,
            event_type: eventType,
            stripe_event_id: metadata.id,
            metadata: metadata,
        }),
    });
}

function getTierFromPriceId(priceId: string): string {
    // Map price IDs to tiers
    const priceMap: Record<string, string> = {
        [Deno.env.get('VITE_STRIPE_PRO_MONTHLY_PRICE_ID') || '']: 'pro',
        [Deno.env.get('VITE_STRIPE_ELITE_MONTHLY_PRICE_ID') || '']: 'elite',
    };
    return priceMap[priceId] || 'free';
}
