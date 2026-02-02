import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// 🎨 CONFIGURAÇÃO DO EMAIL
// ============================================
const EMAIL_CONFIG = {
  brand: {
    name: "My Invest",
    emoji: "💰",
    year: new Date().getFullYear(),
    website: "https://myinvestapp.lovable.app",
  },
  colors: {
    primary: "#22c55e",
    background: "#0a0a0f",
    cardBg: "#18181b",
    textPrimary: "#ffffff",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    textDark: "#52525b",
    warning: "#fbbf24",
    danger: "#ef4444",
    success: "#22c55e",
    info: "#3b82f6",
  },
};

// ============================================
// 📊 TIPOS
// ============================================
interface Investment {
  id: string;
  name: string;
  ticker: string | null;
  category: string;
  quantity: number;
  average_price: number;
  current_price: number;
  invested_amount: number;
  current_value: number;
  profit_loss: number;
  profit_loss_percent: number;
}

interface Transaction {
  id: string;
  type: string;
  investment_name: string;
  quantity: number;
  price: number;
  total_value: number;
  date: string;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
}

interface ReportData {
  month: string;
  year: number;
  totalValue: string;
  totalInvested: string;
  profitLoss: string;
  profitLossPercent: string;
  isPositive: boolean;
  topPerformers: { name: string; percent: string }[];
  worstPerformers: { name: string; percent: string }[];
  newInvestments: number;
  totalTransactions: number;
}

// ============================================
// 💰 FUNÇÕES DE FORMATAÇÃO
// ============================================
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

const getMonthName = (month: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month];
};

// ============================================
// 📧 TEMPLATE DO EMAIL
// ============================================
const getMonthlyReportEmailHtml = (username: string, data: ReportData): string => {
  const { colors, brand } = EMAIL_CONFIG;
  const profitColor = data.isPositive ? colors.success : colors.danger;
  const profitIcon = data.isPositive ? "📈" : "📉";

  const topPerformersHtml = data.topPerformers.length > 0 ? `
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">🏆 Melhores Performances</p>
      ${data.topPerformers.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${colors.background};">
          <span style="color: ${colors.textSecondary}; font-size: 14px;">${item.name}</span>
          <span style="color: ${colors.success}; font-size: 14px; font-weight: bold;">${item.percent}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  const worstPerformersHtml = data.worstPerformers.length > 0 ? `
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">📉 Atenção Necessária</p>
      ${data.worstPerformers.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${colors.background};">
          <span style="color: ${colors.textSecondary}; font-size: 14px;">${item.name}</span>
          <span style="color: ${colors.danger}; font-size: 14px; font-weight: bold;">${item.percent}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório Mensal - ${brand.name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 28px; font-weight: bold; color: ${colors.primary};">${brand.emoji} ${brand.name}</span>
    </div>
    
    <!-- Header -->
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">📊</span>
    </div>
    
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 8px;">
      Relatório Mensal
    </h1>
    <p style="color: ${colors.textMuted}; font-size: 16px; text-align: center; margin: 0 0 24px;">
      ${data.month} de ${data.year}
    </p>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Aqui está o resumo da sua carteira no mês passado.
    </p>
    
    <!-- Main Stats -->
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: ${colors.textMuted}; font-size: 14px; margin: 0 0 8px;">Patrimônio Total</p>
        <p style="color: ${colors.primary}; font-size: 32px; font-weight: bold; margin: 0;">${data.totalValue}</p>
      </div>
      
      <table style="width: 100%; text-align: center;">
        <tr>
          <td style="padding: 8px;">
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 0 0 4px;">Investido</p>
            <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin: 0;">${data.totalInvested}</p>
          </td>
          <td style="padding: 8px;">
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 0 0 4px;">${profitIcon} Resultado</p>
            <p style="color: ${profitColor}; font-size: 16px; font-weight: bold; margin: 0;">
              ${data.profitLoss} (${data.profitLossPercent})
            </p>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Activity Summary -->
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">📋 Atividade do Mês</p>
      <table style="width: 100%; text-align: center;">
        <tr>
          <td style="padding: 8px;">
            <p style="color: ${colors.primary}; font-size: 24px; font-weight: bold; margin: 0;">${data.newInvestments}</p>
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0;">Novos Aportes</p>
          </td>
          <td style="padding: 8px;">
            <p style="color: ${colors.info}; font-size: 24px; font-weight: bold; margin: 0;">${data.totalTransactions}</p>
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0;">Transações</p>
          </td>
        </tr>
      </table>
    </div>
    
    ${topPerformersHtml}
    ${worstPerformersHtml}
    
    <!-- CTA Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${brand.website}" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Ver Relatório Completo
      </a>
    </div>
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 24px;">
      Este relatório é gerado automaticamente no primeiro dia de cada mês.
    </p>
    
    <!-- Footer -->
    <p style="color: ${colors.textDark}; font-size: 12px; text-align: center; margin-top: 32px;">
      © ${brand.year} ${brand.name}. Todos os direitos reservados.
    </p>
  </div>
</body>
</html>
`;
};

// ============================================
// 🚀 HANDLER PRINCIPAL
// ============================================
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting monthly report generation...");

    // Create Supabase client with service role for accessing all users
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate the previous month
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStart = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
    const monthEnd = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0, 23, 59, 59);

    const monthName = getMonthName(previousMonth.getMonth());
    const year = previousMonth.getFullYear();

    console.log(`Generating report for ${monthName} ${year}`);

    // Get all profiles (users with accounts)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, username');

    if (profilesError) {
      throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log("No users found to send reports to");
      return new Response(
        JSON.stringify({ success: true, message: "No users to send reports to", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${profiles.length} users to process`);

    // Get user emails from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to fetch auth users: ${authError.message}`);
    }

    const userEmailMap = new Map<string, string>();
    authUsers.users.forEach(user => {
      if (user.email) {
        userEmailMap.set(user.id, user.email);
      }
    });

    const fromEmail = Deno.env.get("FROM_EMAIL") || `${EMAIL_CONFIG.brand.name} <onboarding@resend.dev>`;
    let sentCount = 0;
    const errors: string[] = [];

    // Process each user
    for (const profile of profiles) {
      try {
        const userEmail = userEmailMap.get(profile.user_id);
        
        if (!userEmail) {
          console.log(`No email found for user ${profile.user_id}, skipping`);
          continue;
        }

        const username = profile.display_name || profile.username || 'Investidor';

        // Fetch user's investments
        const { data: investments, error: investmentsError } = await supabase
          .from('investments')
          .select('*')
          .eq('user_id', profile.user_id);

        if (investmentsError) {
          console.error(`Failed to fetch investments for user ${profile.user_id}:`, investmentsError);
          errors.push(`User ${profile.user_id}: ${investmentsError.message}`);
          continue;
        }

        // Skip users with no investments
        if (!investments || investments.length === 0) {
          console.log(`User ${profile.user_id} has no investments, skipping`);
          continue;
        }

        // Fetch transactions from the previous month
        const { data: transactions, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', profile.user_id)
          .gte('date', monthStart.toISOString())
          .lte('date', monthEnd.toISOString());

        if (transactionsError) {
          console.error(`Failed to fetch transactions for user ${profile.user_id}:`, transactionsError);
        }

        // Calculate totals
        const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
        const totalInvested = investments.reduce((sum, inv) => sum + (inv.invested_amount || 0), 0);
        const totalProfitLoss = totalValue - totalInvested;
        const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

        // Get top and worst performers (investments with non-zero profit/loss)
        const sortedByPerformance = investments
          .filter(inv => inv.invested_amount > 0)
          .sort((a, b) => (b.profit_loss_percent || 0) - (a.profit_loss_percent || 0));

        const topPerformers = sortedByPerformance
          .filter(inv => (inv.profit_loss_percent || 0) > 0)
          .slice(0, 3)
          .map(inv => ({
            name: inv.ticker || inv.name,
            percent: formatPercent(inv.profit_loss_percent || 0),
          }));

        const worstPerformers = sortedByPerformance
          .filter(inv => (inv.profit_loss_percent || 0) < 0)
          .slice(-3)
          .reverse()
          .map(inv => ({
            name: inv.ticker || inv.name,
            percent: formatPercent(inv.profit_loss_percent || 0),
          }));

        // Count new investments (buy transactions) in the month
        const buyTransactions = (transactions || []).filter(t => t.type === 'buy');
        const newInvestments = buyTransactions.length;
        const totalTransactions = (transactions || []).length;

        const reportData: ReportData = {
          month: monthName,
          year,
          totalValue: formatCurrency(totalValue),
          totalInvested: formatCurrency(totalInvested),
          profitLoss: formatCurrency(totalProfitLoss),
          profitLossPercent: formatPercent(totalProfitLossPercent),
          isPositive: totalProfitLoss >= 0,
          topPerformers,
          worstPerformers,
          newInvestments,
          totalTransactions,
        };

        // Generate and send email
        const html = getMonthlyReportEmailHtml(username, reportData);
        const subject = `📊 Seu Relatório Mensal - ${monthName} | ${EMAIL_CONFIG.brand.name}`;

        const emailResponse = await resend.emails.send({
          from: fromEmail,
          to: [userEmail],
          subject,
          html,
        });

        console.log(`Email sent to ${userEmail}:`, emailResponse);
        sentCount++;
      } catch (userError: any) {
        console.error(`Error processing user ${profile.user_id}:`, userError);
        errors.push(`User ${profile.user_id}: ${userError.message}`);
      }
    }

    console.log(`Monthly report completed. Sent: ${sentCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Monthly report sent to ${sentCount} users`,
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in monthly-report:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
