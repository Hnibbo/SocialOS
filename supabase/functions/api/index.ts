import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Content-Type': 'application/json'
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { method } = req;
    const url = new URL(req.url);
    const path = url.pathname;

    // Health check
    if (path === '/health') {
      return new Response(JSON.stringify({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        functions: 'operational'
      }), { 
        headers: corsHeaders,
        status: 200 
      });
    }

    // Auth endpoints
    if (path.startsWith('/auth/')) {
      const authUrl = `${process.env.SUPABASE_URL}/auth/v1${path.replace('/auth', '')}`;
      
      if (method === 'POST' && path.includes('/signup')) {
        const body = await req.json();
        const { email, password, data } = body;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: data?.name || 'New User',
              username: email.split('@')[0]
            }
          }
        });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ 
          data,
          message: 'User created successfully',
          user: {
            id: data.user?.id,
            email: data.user?.email,
            name: data.user?.user_metadata?.name
          }
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      if (method === 'POST' && path.includes('/signin')) {
        const body = await req.json();
        const { email, password } = body;
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 401,
            headers: corsHeaders
          });
        }

        if (data.user) {
          return new Response(JSON.stringify({ 
            data,
            message: 'Sign in successful',
            session: data.session,
            user: {
              id: data.user.id,
              email: data.user.email,
              name: data.user.user_metadata?.name
            }
          }), {
            status: 200,
            headers: {
              ...corsHeaders,
              'Set-Cookie': `access_token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=None`
            }
          });
        }
      }
    }

    // Profile endpoints
    if (path.startsWith('/profiles/')) {
      if (method === 'GET') {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', 'desc');

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ 
          profiles: data || [],
          count: data?.length || 0
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
    }

    // Streaming endpoints
    if (path.startsWith('/streaming/')) {
      if (method === 'POST' && path.includes('/token')) {
        const body = await req.json();
        const { identity } = body;
        
        // Generate LiveKit token (you'd implement this with your LiveKit API)
        const token = "livekit-token-placeholder";
        
        return new Response(JSON.stringify({ 
          token,
          identity,
          serverUrl: "wss://your-livekit-server.com",
          expiresIn: 3600
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
    }

    // Default response
    return new Response(JSON.stringify({ 
      error: 'Endpoint not found',
      availableEndpoints: [
        '/health',
        '/auth/v1/signup',
        '/auth/v1/signin',
        '/profiles',
        '/streaming/token'
      ]
    }), {
      status: 404,
      headers: corsHeaders
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
});