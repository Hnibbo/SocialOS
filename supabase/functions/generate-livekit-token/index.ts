import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { AccessToken } from 'npm:livekit-server-sdk@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Extract the JWT from the Authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        // Create Supabase client with service role for admin operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Validate the user's JWT by getting user info
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
            authHeader.replace('Bearer ', '')
        );

        if (authError || !user) {
            console.error('Auth error:', authError);
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        const { roomName, identity, metadata } = await req.json();

        if (!roomName || !identity) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        const apiKey = Deno.env.get('LIVEKIT_API_KEY');
        const apiSecret = Deno.env.get('LIVEKIT_API_SECRET');

        if (!apiKey || !apiSecret) {
            console.error("LiveKit misconfigured");
            return new Response(JSON.stringify({
                error: 'LiveKit not configured. Please contact admin.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 503,
            });
        }

        const at = new AccessToken(apiKey, apiSecret, {
            identity: identity,
            name: metadata?.name || user.email,
        });

        at.addGrant({
            roomJoin: true,
            room: roomName,
            canPublish: true,
            canSubscribe: true,
        });

        const token = await at.toJwt();

        return new Response(
            JSON.stringify({ token, url: Deno.env.get('LIVEKIT_URL') || 'wss://livekit.example.com' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Edge Function error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
