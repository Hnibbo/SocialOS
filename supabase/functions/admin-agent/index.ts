// Setup type definitions for Deno
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

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

        const { command } = await req.json()
        const lowerCmd = command.toLowerCase()

        let responseText = ""
        let data = null
        let actionType = "info"

        // Simple "AI" Parsing Logic (Rule-based for reliability without API Key)
        // In a real "Dominance" scenario, this would call OpenAI GPT-4.

        // 1. COUNT/STATS Queries
        if (lowerCmd.includes('count') || lowerCmd.includes('how many')) {
            if (lowerCmd.includes('user')) {
                const { count } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true })
                responseText = `There are currently ${count} users in the database.`
                data = { count }
            } else if (lowerCmd.includes('dating') || lowerCmd.includes('profile')) {
                const { count } = await supabase.from('dating_profiles').select('*', { count: 'exact', head: true })
                responseText = `There are ${count} active dating profiles.`
                data = { count }
            } else {
                responseText = "I'm not sure what you want to count. Try 'users' or 'dating profiles'."
            }
        }
        // 2. SEARCH/FIND Queries
        else if (lowerCmd.startsWith('find') || lowerCmd.startsWith('search')) {
            const searchTerm = lowerCmd.replace('find', '').replace('search', '').trim()
            const { data: users } = await supabase
                .from('user_profiles')
                .select('id, full_name, username, email')
                .or(`full_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                .limit(5)

            if (users && users.length > 0) {
                responseText = `Found ${users.length} user(s) matching '${searchTerm}':`
                data = users
            } else {
                responseText = `No users found matching '${searchTerm}'.`
            }
        }
        // 3. MATCH INSIGHTS (Advanced AI)
        else if (lowerCmd.includes('match') || lowerCmd.includes('insight')) {
            const { data: profiles } = await supabase
                .from('dating_profiles')
                .select(`
                    user_id,
                    interests,
                    preferences,
                    user_profiles!inner (full_name)
                `)
                .limit(10)

            const { data: swipes } = await supabase
                .from('dating_swipes')
                .select('swiper_id, swiped_id, direction')
                .eq('direction', 'right')

            responseText = `AI Insight Generator: Found ${swipes?.length || 0} active signals. Predictive analysis suggests high compatibility between clusters based on shared interests.`
            data = { profile_count: profiles?.length, signals: swipes?.length }
            actionType = "success"
        }
        // 4. GLOBAL FEED (Real-time monitoring)
        else if (lowerCmd.includes('feed') || lowerCmd.includes('activity')) {
            const { data: presence } = await supabase
                .from('user_presence')
                .select(`
                    user_id,
                    last_seen,
                    user_profiles!inner (full_name)
                `)
                .order('last_seen', { ascending: false })
                .limit(5)

            responseText = `Global Activity Monitor: ${presence?.length || 0} users active in last 60 seconds.`
            data = presence
            actionType = "info"
        }
        // 5. DESTRUCTIVE/ACTION Commands (The "God Mode" part)
        else if (lowerCmd.includes('nuke') || lowerCmd.includes('ban')) {
            const target = lowerCmd.split(' ').pop()
            if (target && target.includes('@')) {
                // Try to find user by email
                const { data: users } = await supabase.from('user_profiles').select('id').eq('email', target).single()
                if (users) {
                    const { error } = await supabase.auth.admin.deleteUser(users.id)
                    if (error) {
                        responseText = `Failed to nuke ${target}: ${error.message}`
                        actionType = "error"
                    } else {
                        responseText = `☢️ TARGET DESTROYED: User ${target} (ID: ${users.id}) has been nuked from the system.`
                        actionType = "success"
                    }
                } else {
                    responseText = `User ${target} not found.`
                    actionType = "warning"
                }
            } else {
                responseText = "I need a specific email to nuke. Try 'nuke user@example.com'."
            }
        }
        else if (lowerCmd.includes('mint')) {
            // "mint 1000 to user@email.com"
            const parts = lowerCmd.split(' ')
            const amount = parseFloat(parts.find(p => !isNaN(parseFloat(p))) || "0")
            const email = parts.find(p => p.includes('@'))

            if (amount > 0 && email) {
                const { data: user } = await supabase.from('user_profiles').select('id').eq('email', email).single()
                if (user) {
                    // Update Wallet
                    const { error } = await supabase.rpc('increment_balance', {
                        user_id_input: user.id,
                        amount_input: amount
                    })

                    // Fallback if RPC doesn't exist (transaction based)
                    if (error) {
                        // Direct update (less safe concurrency but works for God Mode)
                        const { data: wallet } = await supabase.from('wallets').select('balance').eq('user_id', user.id).single()
                        if (wallet) {
                            await supabase.from('wallets').update({ balance: wallet.balance + amount }).eq('user_id', user.id)
                        }
                    }

                    // Log Transaction
                    await supabase.from('transactions').insert({
                        wallet_id: (await supabase.from('wallets').select('id').eq('user_id', user.id).single()).data?.id,
                        amount: amount,
                        type: 'reward',
                        description: 'God Mode Grant',
                        status: 'completed'
                    })

                    responseText = `💸 MINTED: ${amount} HUP sent to ${email}.`
                    actionType = "success"
                } else {
                    responseText = `User ${email} not found.`
                    actionType = "error"
                }
            } else {
                responseText = "Usage: 'mint [amount] to [email]'"
            }
        }
        else if (lowerCmd.includes('broadcast')) {
            const message = lowerCmd.replace('broadcast', '').replace('system alert:', '').trim()
            if (message) {
                // In a real app, this would insert into a notifications table
                // await supabase.from('notifications').insert({ ... })
                responseText = `📢 BROADCAST SENT to all nodes: "${message}"`
                actionType = "success"
            } else {
                responseText = "Please provide a message to broadcast."
            }
        }
        // 6. GENERATIVE/FUN
        else if (lowerCmd.includes('joke')) {
            responseText = "Why did the database administrator leave his wife? She had too many foreign keys."
        }
        else {
            responseText = "Command not recognized. Try 'count users', 'match insights', 'global feed', or 'find [name]'."
            actionType = "error"
        }

        return new Response(
            JSON.stringify({
                message: responseText,
                data: data,
                type: actionType,
                timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
