import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.16.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
})

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { action, ...params } = await req.json()

        let result = {}

        switch (action) {
            case 'sync-plans': {
                // List products from Stripe
                const products = await stripe.products.list({ active: true, expand: ['data.default_price'] })

                // The database trigger 'tr_sync_stripe_products' (if extension table synced) 
                // but here we manually sync for immediate feedback
                for (const product of products.data) {
                    const { error } = await supabase.from('subscription_plans').upsert({
                        name: product.name,
                        slug: product.metadata.slug || product.name.toLowerCase().replace(/ /g, '-'),
                        description: product.description,
                        stripe_product_id: product.id,
                        is_active: product.active,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'stripe_product_id' })

                    if (error) throw error
                }
                result = { message: `Synced ${products.data.length} plans successfully.` }
                break
            }

            case 'create-checkout': {
                const { priceId, userId, successUrl, cancelUrl } = params
                const session = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [{ price: priceId, quantity: 1 }],
                    mode: 'subscription',
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                    metadata: { user_id: userId }
                })
                result = { url: session.url }
                break
            }

            case 'create-portal': {
                const { customerId, returnUrl } = params
                const portal = await stripe.billingPortal.sessions.create({
                    customer: customerId,
                    return_url: returnUrl,
                })
                result = { url: portal.url }
                break
            }

            default:
                throw new Error(`Invalid action: ${action}`)
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
