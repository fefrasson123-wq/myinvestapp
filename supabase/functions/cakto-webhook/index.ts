import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface CaktoWebhookPayload {
  event: string;
  data: {
    customer: {
      email: string;
      name: string;
      phone?: string;
    };
    product: {
      id: string;
      name: string;
    };
    subscription?: {
      id: string;
      status: string;
      plan?: string;
      next_billing_date?: string;
    };
    transaction?: {
      id: string;
      status: string;
      amount: number;
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret') || req.headers.get('X-Webhook-Secret');
    const expectedSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET');

    if (!expectedSecret || webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: CaktoWebhookPayload = await req.json();
    console.log('Received Cakto webhook:', JSON.stringify(payload, null, 2));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { event, data } = payload;
    const customerEmail = data.customer?.email;

    if (!customerEmail) {
      console.error('No customer email in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Customer email required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find user by email
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error listing users:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to find user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user = authData.users.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());
    
    if (!user) {
      console.log(`User not found for email: ${customerEmail}`);
      // Return success - user might register later
      return new Response(
        JSON.stringify({ success: true, message: 'User not found, will be processed on registration' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine plan based on product name or subscription plan
    const productName = data.product?.name?.toLowerCase() || '';
    const subscriptionPlan = data.subscription?.plan?.toLowerCase() || '';
    
    let planName = 'pro'; // default to pro
    if (productName.includes('premium') || subscriptionPlan.includes('premium')) {
      planName = 'premium';
    } else if (productName.includes('pro') || subscriptionPlan.includes('pro')) {
      planName = 'pro';
    }

    // Get plan ID
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .eq('name', planName)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planName, planError);
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different events
    switch (event) {
      case 'purchase_approved':
      case 'compra_aprovada':
      case 'subscription_created':
      case 'assinatura_criada': {
        // Create or update subscription
        const subscriptionData = {
          user_id: user.id,
          plan_id: plan.id,
          status: 'active',
          cakto_subscription_id: data.subscription?.id || data.transaction?.id || null,
          cakto_customer_id: customerEmail,
          current_period_start: new Date().toISOString(),
          current_period_end: data.subscription?.next_billing_date 
            ? new Date(data.subscription.next_billing_date).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
        };

        const { error: upsertError } = await supabase
          .from('user_subscriptions')
          .upsert(subscriptionData, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Error upserting subscription:', upsertError);
          return new Response(
            JSON.stringify({ error: 'Failed to create subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Subscription activated for user ${user.id} with plan ${planName}`);
        break;
      }

      case 'subscription_renewed':
      case 'assinatura_renovada':
      case 'payment_received':
      case 'pagamento_recebido': {
        // Renew subscription
        const { error: renewError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: data.subscription?.next_billing_date 
              ? new Date(data.subscription.next_billing_date).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq('user_id', user.id);

        if (renewError) {
          console.error('Error renewing subscription:', renewError);
          return new Response(
            JSON.stringify({ error: 'Failed to renew subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Subscription renewed for user ${user.id}`);
        break;
      }

      case 'subscription_canceled':
      case 'assinatura_cancelada':
      case 'subscription_expired':
      case 'assinatura_expirada': {
        // Cancel subscription
        const { error: cancelError } = await supabase
          .from('user_subscriptions')
          .update({
            status: event.includes('expired') || event.includes('expirada') ? 'expired' : 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (cancelError) {
          console.error('Error canceling subscription:', cancelError);
          return new Response(
            JSON.stringify({ error: 'Failed to cancel subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Subscription canceled for user ${user.id}`);
        break;
      }

      case 'refund':
      case 'reembolso':
      case 'chargeback': {
        // Handle refund - cancel subscription
        const { error: refundError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (refundError) {
          console.error('Error handling refund:', refundError);
        }

        console.log(`Subscription canceled due to ${event} for user ${user.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return new Response(
      JSON.stringify({ success: true, event, user_id: user.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
