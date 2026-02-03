import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface IncomePayment {
  id: string;
  user_id: string;
  investment_id: string | null;
  investment_name: string;
  amount: number;
  payment_date: string;
  type: string;
  category: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar pagamentos de dividendos das últimas 24 horas
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`Verificando dividendos pagos entre ${yesterdayStr} e ${todayStr}`);

    // Buscar pagamentos recentes
    const { data: payments, error: paymentsError } = await supabase
      .from("income_payments")
      .select("*")
      .gte("payment_date", yesterdayStr)
      .lte("payment_date", todayStr)
      .in("type", ["Dividendo", "Aluguel", "Juros"]);

    if (paymentsError) {
      console.error("Erro ao buscar pagamentos:", paymentsError);
      throw paymentsError;
    }

    if (!payments || payments.length === 0) {
      console.log("Nenhum pagamento encontrado nas últimas 24h");
      return new Response(
        JSON.stringify({ success: true, notifications_created: 0, message: "Nenhum pagamento encontrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Encontrados ${payments.length} pagamentos`);

    // Agrupar pagamentos por usuário para evitar spam
    const paymentsByUser: Record<string, IncomePayment[]> = {};
    for (const payment of payments) {
      if (!paymentsByUser[payment.user_id]) {
        paymentsByUser[payment.user_id] = [];
      }
      paymentsByUser[payment.user_id].push(payment);
    }

    let notificationsCreated = 0;

    // Criar notificações para cada usuário
    for (const [userId, userPayments] of Object.entries(paymentsByUser)) {
      // Verificar se já existe notificação para esses pagamentos hoje
      const { data: existingNotifications } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "dividend")
        .gte("created_at", todayStr);

      // Se já tem notificação hoje, pular
      if (existingNotifications && existingNotifications.length > 0) {
        console.log(`Usuário ${userId} já recebeu notificação hoje, pulando...`);
        continue;
      }

      // Calcular total recebido
      const totalAmount = userPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // Criar mensagem detalhada
      let message = "";
      if (userPayments.length === 1) {
        const p = userPayments[0];
        const typeLabel = p.type === "Dividendo" ? "dividendos" : p.type === "Aluguel" ? "aluguel" : "juros";
        message = `${p.investment_name} pagou R$ ${p.amount.toFixed(2)} de ${typeLabel} hoje!`;
      } else {
        const details = userPayments.slice(0, 3).map(p => `${p.investment_name}: R$ ${p.amount.toFixed(2)}`).join(", ");
        const extra = userPayments.length > 3 ? ` e mais ${userPayments.length - 3} ativos` : "";
        message = `Você recebeu R$ ${totalAmount.toFixed(2)} em proventos hoje! ${details}${extra}`;
      }

      const title = userPayments.length === 1 
        ? `💰 Dividendo Recebido!` 
        : `💰 ${userPayments.length} Proventos Recebidos!`;

      // Inserir notificação
      const { error: insertError } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type: "dividend",
          title,
          message,
          investment_id: userPayments.length === 1 ? userPayments[0].investment_id : null,
          investment_name: userPayments.length === 1 ? userPayments[0].investment_name : null,
          amount: totalAmount,
          is_read: false,
        });

      if (insertError) {
        console.error(`Erro ao criar notificação para ${userId}:`, insertError);
      } else {
        notificationsCreated++;
        console.log(`Notificação criada para usuário ${userId}: ${message}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notifications_created: notificationsCreated,
        payments_found: payments.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro na função check-dividend-notifications:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
