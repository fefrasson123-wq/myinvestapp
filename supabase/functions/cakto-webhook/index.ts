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
    const payload = await req.json();
    console.log('=== CAKTO WEBHOOK RECEIVED ===');
    console.log('Full payload:', JSON.stringify(payload, null, 2));

    // --- 1. Validate secret ---
    const webhookSecret = req.headers.get('x-webhook-secret') || req.headers.get('X-Webhook-Secret') || payload.secret;
    const secretPro = Deno.env.get('CAKTO_WEBHOOK_SECRET');
    const secretPremium = Deno.env.get('CAKTO_WEBHOOK_SECRET_PREMIUM');

    if (!webhookSecret) {
      console.error('No secret provided in header or body');
      return jsonResponse({ error: 'Unauthorized - no secret' }, 401);
    }

    // Determine plan by which secret matched (most reliable method)
    let planBySecret: 'pro' | 'premium' | null = null;
    if (secretPro && webhookSecret === secretPro) {
      planBySecret = 'pro';
    } else if (secretPremium && webhookSecret === secretPremium) {
      planBySecret = 'premium';
    } else {
      console.error('Invalid webhook secret:', webhookSecret);
      return jsonResponse({ error: 'Unauthorized - invalid secret' }, 401);
    }

    console.log(`Secret matched: ${planBySecret} plan`);

    // --- 2. Extract event and data ---
    const event = (payload.event || '').replace(/^=/, '').trim();
    const data = payload.data;

    if (!data) {
      console.error('Missing data field in payload');
      return jsonResponse({ error: 'Missing data field' }, 400);
    }

    // Extract customer info (Cakto nests customer inside data)
    const customerEmail = data.customer?.email;
    const customerName = data.customer?.name;

    if (!customerEmail) {
      console.error('No customer email found in payload.data.customer.email');
      return jsonResponse({ error: 'Customer email required' }, 400);
    }

    console.log(`Event: ${event}, Customer: ${customerEmail}, Plan: ${planBySecret}`);

    // Extract IDs
    const transactionId = data.id || data.refId || null;
    const subscriptionId = data.subscription?.id || null;
    const nextPaymentDate = data.subscription?.next_payment_date || null;

    // --- 3. Initialize Supabase ---
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // --- 4. Find user by email ---
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Error listing users:', authError);
      return jsonResponse({ error: 'Failed to find user' }, 500);
    }

    const user = authData.users.find(u => u.email?.toLowerCase() === customerEmail.toLowerCase());

    // If user not found, save as pending purchase
    if (!user) {
      console.log(`User not found for email: ${customerEmail}. Saving as pending purchase.`);
      return await savePendingPurchase(supabase, {
        email: customerEmail.toLowerCase(),
        planName: planBySecret,
        customerName,
        subscriptionId,
        transactionId,
        payload,
      });
    }

    console.log(`User found: ${user.id} (${user.email})`);

    // --- 5. Get plan from DB ---
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, display_name, features')
      .eq('name', planBySecret)
      .single();

    if (planError || !plan) {
      console.error('Plan not found:', planBySecret, planError);
      return jsonResponse({ error: 'Plan not found' }, 500);
    }

    // Calculate period end (31 days from now, or next payment date)
    const periodEnd = nextPaymentDate
      ? new Date(nextPaymentDate).toISOString()
      : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

    // --- 6. Handle events ---
    switch (event) {
      case 'purchase_approved':
      case 'compra_aprovada':
      case 'subscription_created':
      case 'assinatura_criada': {
        console.log(`Activating ${planBySecret} for user ${user.id}...`);
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
          return jsonResponse({ error: 'Failed to create subscription' }, 500);
        }
        console.log(`✅ Subscription activated for user ${user.id} with plan ${planBySecret}`);

        // Send upgrade email (non-blocking)
        sendUpgradeEmail(supabase, customerEmail, customerName, user, plan).catch(e =>
          console.error('Failed to send upgrade email:', e)
        );
        break;
      }

      case 'subscription_renewed':
      case 'assinatura_renovada':
      case 'payment_received':
      case 'pagamento_recebido': {
        console.log(`Renewing ${planBySecret} for user ${user.id}...`);
        const { error: renewError } = await supabase
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

        if (renewError) {
          console.error('Error renewing subscription:', renewError);
          return jsonResponse({ error: 'Failed to renew subscription' }, 500);
        }
        console.log(`✅ Subscription renewed for user ${user.id} with plan ${planBySecret}`);
        break;
      }

      case 'subscription_canceled':
      case 'assinatura_cancelada':
      case 'subscription_expired':
      case 'assinatura_expirada':
      case 'subscription_renewal_refused': {
        const newStatus = (event.includes('expired') || event.includes('expirada')) ? 'expired' : 'canceled';
        console.log(`Setting subscription to ${newStatus} for user ${user.id}...`);
        const { error: cancelError } = await supabase
          .from('user_subscriptions')
          .update({
            status: newStatus,
            canceled_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (cancelError) {
          console.error('Error canceling subscription:', cancelError);
          return jsonResponse({ error: 'Failed to cancel subscription' }, 500);
        }
        console.log(`✅ Subscription ${newStatus} for user ${user.id}`);
        break;
      }

      case 'refund':
      case 'reembolso':
      case 'chargeback': {
        console.log(`Processing ${event} for user ${user.id}...`);
        const { error: refundError } = await supabase
          .from('user_subscriptions')
          .update({ status: 'canceled', canceled_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (refundError) {
          console.error('Error handling refund:', refundError);
          return jsonResponse({ error: 'Failed to process refund' }, 500);
        }
        console.log(`✅ Subscription canceled due to ${event} for user ${user.id}`);
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: "${event}"`);
    }

    return jsonResponse({ success: true, event, user_id: user.id, plan: planBySecret });

  } catch (error) {
    console.error('Webhook error:', error);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});

// --- Helper functions ---

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function savePendingPurchase(
  supabase: ReturnType<typeof createClient>,
  opts: {
    email: string;
    planName: string;
    customerName: string | null;
    subscriptionId: string | null;
    transactionId: string | null;
    payload: unknown;
  }
) {
  const { error } = await supabase
    .from('pending_purchases')
    .insert({
      email: opts.email,
      plan_name: opts.planName,
      customer_name: opts.customerName || null,
      cakto_subscription_id: opts.subscriptionId,
      cakto_transaction_id: opts.transactionId,
      payload: opts.payload,
      status: 'pending',
    });

  if (error) {
    console.error('Error saving pending purchase:', error);
    return jsonResponse({ error: 'Failed to save pending purchase' }, 500);
  }

  console.log(`✅ Pending purchase saved for ${opts.email} (${opts.planName})`);
  return jsonResponse({ success: true, message: 'Purchase saved as pending. Will activate on user registration.' });
}

async function sendUpgradeEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
  customerName: string | null,
  user: { user_metadata?: { display_name?: string; full_name?: string } },
  plan: { display_name: string; features: unknown }
) {
  const username = customerName || user.user_metadata?.display_name || user.user_metadata?.full_name || 'Investidor';
  const planFeatures = (plan.features as string[]) || [];
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
    body: JSON.stringify({
      type: 'plan-upgrade',
      to: email,
      data: { username, planName: plan.display_name, planFeatures, dashboardUrl: 'https://myinvestapp.com.br' },
    }),
  });

  console.log(`✅ Upgrade email sent to ${email}`);
}
