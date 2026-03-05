import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret (header or body field)
    const payload = await req.json();
    const webhookSecret = req.headers.get('x-webhook-secret') || req.headers.get('X-Webhook-Secret') || payload.secret;
    const expectedSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET');

    if (!expectedSecret || webhookSecret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Received Cakto webhook:', JSON.stringify(payload, null, 2));

    // Extract fields from Cakto's native payload format
    const event = payload.event;
    const data = payload.data;

    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Missing data field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const customerEmail = data.customer?.email;
    const customerName = data.customer?.name;
    const productName = data.product?.name?.toLowerCase() || '';
    const transactionId = data.id || null;
    const subscriptionId = data.subscription?.id || null;
    const nextPaymentDate = data.subscription?.next_payment_date || null;
    const amount = data.amount || data.baseAmount || 0;

    if (!customerEmail) {
      console.error('No customer email in webhook payload');
      return new Response(
        JSON.stringify({ error: 'Customer email required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Determine plan: Premium if amount >= 79 or product name contains "premium", otherwise Pro
    let planName = 'pro';
    if (productName.includes('premium') || amount >= 79) {
      planName = 'premium';
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

    // If user not found, save as pending purchase
    if (!user) {
      console.log(`User not found for email: ${customerEmail}. Saving as pending purchase.`);
      const { error: pendingError } = await supabase
        .from('pending_purchases')
        .insert({
          email: customerEmail.toLowerCase(),
          plan_name: planName,
          customer_name: customerName || null,
          cakto_subscription_id: subscriptionId,
          cakto_transaction_id: transactionId,
          payload: payload,
          status: 'pending',
        });

      if (pendingError) {
        console.error('Error saving pending purchase:', pendingError);
        return new Response(
          JSON.stringify({ error: 'Failed to save pending purchase' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Purchase saved as pending. Will activate on user registration.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get plan from DB
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, display_name, features')
      .eq('name', planName)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planName, planError);
      return new Response(
        JSON.stringify({ error: 'Plan not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate period end
    const periodEnd = nextPaymentDate
      ? new Date(nextPaymentDate).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Handle events
    switch (event) {
      case 'purchase_approved':
      case 'compra_aprovada':
      case 'subscription_created':
      case 'assinatura_criada': {
        const { error: upsertError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            plan_id: plan.id,
            status: 'active',
            cakto_subscription_id: subscriptionId || transactionId,
            cakto_customer_id: customerEmail,
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd,
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Error upserting subscription:', upsertError);
          return new Response(
            JSON.stringify({ error: 'Failed to create subscription' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log(`Subscription activated for user ${user.id} with plan ${planName}`);

        // Send upgrade email (non-blocking)
        try {
          const username = customerName || user.user_metadata?.display_name || 'Investidor';
          const planFeatures = (plan.features as string[]) || [];
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
          const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
            body: JSON.stringify({
              type: 'plan-upgrade',
              to: customerEmail,
              data: { username, planName: plan.display_name, planFeatures, dashboardUrl: 'https://myinvestapp.com.br' },
            }),
          });
        } catch (emailError) {
          console.error('Failed to send upgrade email:', emailError);
        }
        break;
      }

      case 'subscription_renewed':
      case 'assinatura_renovada':
      case 'payment_received':
      case 'pagamento_recebido': {
        const { error: renewError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd,
          })
          .eq('user_id', user.id);

        if (renewError) console.error('Error renewing subscription:', renewError);
        else console.log(`Subscription renewed for user ${user.id}`);
        break;
      }

      case 'subscription_canceled':
      case 'assinatura_cancelada':
      case 'subscription_expired':
      case 'assinatura_expirada': {
        const { error: cancelError } = await supabase
          .from('user_subscriptions')
          .update({
            status: event.includes('expired') || event.includes('expirada') ? 'expired' : 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (cancelError) console.error('Error canceling subscription:', cancelError);
        else console.log(`Subscription canceled for user ${user.id}`);
        break;
      }

      case 'refund':
      case 'reembolso':
      case 'chargeback': {
        const { error: refundError } = await supabase
          .from('user_subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (refundError) console.error('Error handling refund:', refundError);
        else console.log(`Subscription canceled due to ${event} for user ${user.id}`);
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
