import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    // Create a client with the user's token to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminUserId = claimsData.claims.sub;

    // Use service role client to check admin and perform operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: adminCheck } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', adminUserId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id, plan_id } = await req.json();

    if (!user_id || !plan_id) {
      return new Response(JSON.stringify({ error: 'user_id and plan_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, display_name, features')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Delete existing subscription for this user (unique constraint on user_id)
    await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', user_id);

    const now = new Date();
    const periodStart = now.toISOString();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: newSub, error: subError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id,
        plan_id,
        status: 'active',
        current_period_start: periodStart,
        current_period_end: periodEnd,
      })
      .select('id, plan_id')
      .single();

    if (subError) {
      throw new Error(`Failed to create subscription: ${subError.message}`);
    }

    // Send upgrade congratulations email
    if (plan.name === 'pro' || plan.name === 'premium') {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(user_id);
        const userEmail = userData?.user?.email;
        const username = userData?.user?.user_metadata?.display_name || 
                         userData?.user?.user_metadata?.full_name || 
                         'Investidor';
        
        if (userEmail) {
          const planFeatures = (plan.features as string[]) || [
            'Ativos ilimitados',
            'Categorias ilimitadas',
            'Gráficos de evolução',
            'Comparação com benchmarks',
            'Tags personalizadas',
          ];

          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              type: 'plan-upgrade',
              to: userEmail,
              data: {
                username,
                planName: plan.display_name,
                planFeatures,
                dashboardUrl: 'https://myinvestapp.lovable.app/app',
              },
            }),
          });
          console.log(`Upgrade email sent to ${userEmail}`);
        }
      } catch (emailError) {
        console.error('Failed to send upgrade email (non-blocking):', emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Usuário atualizado para plano ${plan.display_name}`,
        subscription: newSub,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
