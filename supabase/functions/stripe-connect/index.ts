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

        // Verifying JWT for user-specific actions
        const authHeader = req.headers.get('Authorization')!
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)
        if (userError || !user) throw new Error('Unauthorized')

        const { action, ...params } = await req.json()
        let result = {}

        switch (action) {
            case 'create-connect-account': {
                // Check if already has account
                const { data: existing } = await supabase
                    .from('stripe_connect_accounts')
                    .select('stripe_account_id')
                    .eq('user_id', user.id)
                    .single()

                let accountId = existing?.stripe_account_id

                if (!accountId) {
                    const account = await stripe.accounts.create({
                        type: 'express',
                        country: 'US',
                        email: user.email,
                        capabilities: {
                            card_payments: { requested: true },
                            transfers: { requested: true },
                        },
                        metadata: { user_id: user.id }
                    })
                    accountId = account.id

                    await supabase.from('stripe_connect_accounts').insert({
                        user_id: user.id,
                        stripe_account_id: accountId
                    })
                }

                // Create account link for onboarding
                const accountLink = await stripe.accountLinks.create({
                    account: accountId,
                    refresh_url: params.refreshUrl,
                    return_url: params.returnUrl,
                    type: 'account_onboarding',
                })

                result = { url: accountLink.url }
                break
            }

            case 'get-account-status': {
                const { data: acc } = await supabase
                    .from('stripe_connect_accounts')
                    .select('stripe_account_id')
                    .eq('user_id', user.id)
                    .single()

                if (!acc) {
                    result = { status: 'not_created' }
                } else {
                    const account = await stripe.accounts.retrieve(acc.stripe_account_id)
                    result = {
                        status: account.details_submitted ? 'active' : 'pending',
                        details_submitted: account.details_submitted,
                        payouts_enabled: account.payouts_enabled,
                        charges_enabled: account.charges_enabled
                    }
                }
                break
            }

            case 'process-payout': {
                // Check if admin
                if (user.user_metadata?.role !== 'admin') throw new Error('Forbidden')

                const { withdrawalId, amount, destinationAccountId, currency } = params

                // Create transfer to Connect account
                const transfer = await stripe.transfers.create({
                    amount: Math.round(amount * 100), // convert to cents
                    currency: currency || 'usd',
                    destination: destinationAccountId,
                    metadata: { withdrawal_id: withdrawalId }
                })

                if (transfer.id) {
                    // Update withdrawal status (Admin Payouts table)
                    await supabase
                        .from('withdrawals')
                        .update({
                            status: 'completed',
                            stripe_transfer_id: transfer.id
                        })
                        .eq('id', withdrawalId)

                    // NEW: Sync with User Wallet Transactions (The "Social OS" Connection)
                    // 1. Get Wallet ID
                    const { data: wallet } = await supabase
                        .from('wallets')
                        .select('id')
                        .eq('stripe_connect_id', destinationAccountId) // Assuming we link this way or via user_id
                        .single();

                    if (wallet) {
                        await supabase.from('transactions').insert({
                            wallet_id: wallet.id,
                            type: 'payout',
                            amount: -amount, // Negative because it's leaving the internal wallet
                            description: 'Creator Payout to Stripe',
                            status: 'completed',
                            reference_id: transfer.id
                        });
                    }
                }

                result = { transferId: transfer.id }
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
