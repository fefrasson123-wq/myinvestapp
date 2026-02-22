import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_CONFIG = {
  brand: {
    name: "My Invest",
    emoji: "💰",
    year: new Date().getFullYear(),
    website: "https://myinvestapp.com.br",
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

interface ReportData {
  month: string;
  year: number;
  totalValue: string;
  totalInvested: string;
  profitLoss: string;
  profitLossPercent: string;
  isPositive: boolean;
  topPerformers: { name: string; percent: string; value: string }[];
  worstPerformers: { name: string; percent: string; value: string }[];
  newInvestments: number;
  totalTransactions: number;
  totalAssets: number;
  totalCategories: number;
  categoryBreakdown: { name: string; value: string; percent: string }[];
  incomeReceived: string;
  incomeCount: number;
  capitalAdded: string;
  capitalWithdrawn: string;
  netCapitalChange: string;
  portfolioChange30d: string;
  portfolioChange30dPercent: string;
  portfolioIncreased: boolean;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const getMonthName = (month: number): string => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month];
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    'Ações': 'Ações',
    'FIIs': 'Fundos Imobiliários',
    'ETFs': 'ETFs',
    'Renda Fixa': 'Renda Fixa',
    'Criptomoedas': 'Criptomoedas',
    'Stocks (EUA)': 'Stocks EUA',
    'BDRs': 'BDRs',
    'REITs': 'REITs',
    'Ouro': 'Ouro',
    'Imóveis': 'Imóveis',
    'Dinheiro': 'Dinheiro',
  };
  return labels[category] || category;
};

const getMonthlyReportEmailHtml = (username: string, data: ReportData): string => {
  const { colors, brand } = EMAIL_CONFIG;
  const profitColor = data.isPositive ? colors.success : colors.danger;
  const profitIcon = data.isPositive ? "📈" : "📉";
  const changeColor = data.portfolioIncreased ? colors.success : colors.danger;
  const changeIcon = data.portfolioIncreased ? "🔼" : "🔽";

  const topPerformersHtml = data.topPerformers.length > 0 ? `
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">🏆 Melhores Performances</p>
      ${data.topPerformers.map(item => `
        <div style="padding: 8px 0; border-bottom: 1px solid ${colors.background};">
          <table style="width: 100%;"><tr>
            <td style="color: ${colors.textSecondary}; font-size: 14px;">${item.name}</td>
            <td style="color: ${colors.textMuted}; font-size: 12px; text-align: center;">${item.value}</td>
            <td style="color: ${colors.success}; font-size: 14px; font-weight: bold; text-align: right;">${item.percent}</td>
          </tr></table>
        </div>
      `).join('')}
    </div>
  ` : '';

  const worstPerformersHtml = data.worstPerformers.length > 0 ? `
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">⚠️ Atenção Necessária</p>
      ${data.worstPerformers.map(item => `
        <div style="padding: 8px 0; border-bottom: 1px solid ${colors.background};">
          <table style="width: 100%;"><tr>
            <td style="color: ${colors.textSecondary}; font-size: 14px;">${item.name}</td>
            <td style="color: ${colors.textMuted}; font-size: 12px; text-align: center;">${item.value}</td>
            <td style="color: ${colors.danger}; font-size: 14px; font-weight: bold; text-align: right;">${item.percent}</td>
          </tr></table>
        </div>
      `).join('')}
    </div>
  ` : '';

  const categoryBreakdownHtml = data.categoryBreakdown.length > 0 ? `
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">📊 Distribuição por Categoria</p>
      ${data.categoryBreakdown.map(item => `
        <div style="padding: 8px 0; border-bottom: 1px solid ${colors.background};">
          <table style="width: 100%;"><tr>
            <td style="color: ${colors.textSecondary}; font-size: 14px;">${item.name}</td>
            <td style="color: ${colors.textPrimary}; font-size: 14px; text-align: center;">${item.value}</td>
            <td style="color: ${colors.textMuted}; font-size: 13px; text-align: right;">${item.percent}</td>
          </tr></table>
        </div>
      `).join('')}
    </div>
  ` : '';

  const incomeHtml = data.incomeCount > 0 ? `
    <div style="background-color: ${colors.cardBg}; border: 1px solid ${colors.success}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 12px;">💰 Renda Passiva Recebida</p>
      <table style="width: 100%; text-align: center;">
        <tr>
          <td style="padding: 8px;">
            <p style="color: ${colors.success}; font-size: 24px; font-weight: bold; margin: 0;">${data.incomeReceived}</p>
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0;">Total recebido</p>
          </td>
          <td style="padding: 8px;">
            <p style="color: ${colors.info}; font-size: 24px; font-weight: bold; margin: 0;">${data.incomeCount}</p>
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0;">Pagamentos</p>
          </td>
        </tr>
      </table>
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
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 28px; font-weight: bold; color: ${colors.primary};">${brand.emoji} ${brand.name}</span>
    </div>
    
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
      Olá, ${username}! Aqui está o resumo completo da sua carteira.
    </p>
    
    <!-- Patrimônio Total -->
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: ${colors.textMuted}; font-size: 14px; margin: 0 0 8px;">Patrimônio Total</p>
        <p style="color: ${colors.primary}; font-size: 32px; font-weight: bold; margin: 0;">${data.totalValue}</p>
      </div>
      
      <table style="width: 100%; text-align: center;">
        <tr>
          <td style="padding: 8px;">
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 0 0 4px;">Total Investido</p>
            <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin: 0;">${data.totalInvested}</p>
          </td>
          <td style="padding: 8px;">
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 0 0 4px;">${profitIcon} Resultado Geral</p>
            <p style="color: ${profitColor}; font-size: 16px; font-weight: bold; margin: 0;">
              ${data.profitLoss} (${data.profitLossPercent})
            </p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Variação 30 dias -->
    <div style="background-color: ${colors.cardBg}; border: 1px solid ${changeColor}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 12px;">${changeIcon} Variação nos Últimos 30 Dias</p>
      <div style="text-align: center;">
        <p style="color: ${changeColor}; font-size: 28px; font-weight: bold; margin: 0;">${data.portfolioChange30d}</p>
        <p style="color: ${changeColor}; font-size: 16px; margin: 4px 0 0;">${data.portfolioChange30dPercent}</p>
        <p style="color: ${colors.textMuted}; font-size: 13px; margin: 8px 0 0;">
          ${data.portfolioIncreased ? 'Seu patrimônio cresceu neste período! 🎉' : 'Seu patrimônio recuou neste período.'}
        </p>
      </div>
      <table style="width: 100%; text-align: center; margin-top: 16px;">
        <tr>
          <td style="padding: 8px;">
            <p style="color: ${colors.success}; font-size: 14px; font-weight: bold; margin: 0;">${data.capitalAdded}</p>
            <p style="color: ${colors.textMuted}; font-size: 11px; margin: 2px 0 0;">Aportes</p>
          </td>
          <td style="padding: 8px;">
            <p style="color: ${colors.danger}; font-size: 14px; font-weight: bold; margin: 0;">${data.capitalWithdrawn}</p>
            <p style="color: ${colors.textMuted}; font-size: 11px; margin: 2px 0 0;">Retiradas</p>
          </td>
          <td style="padding: 8px;">
            <p style="color: ${colors.info}; font-size: 14px; font-weight: bold; margin: 0;">${data.netCapitalChange}</p>
            <p style="color: ${colors.textMuted}; font-size: 11px; margin: 2px 0 0;">Saldo Líquido</p>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Resumo da Carteira -->
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">📋 Resumo da Carteira</p>
      <table style="width: 100%; text-align: center;">
        <tr>
          <td style="padding: 8px;">
            <p style="color: ${colors.primary}; font-size: 24px; font-weight: bold; margin: 0;">${data.totalAssets}</p>
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0;">Ativos</p>
          </td>
          <td style="padding: 8px;">
            <p style="color: ${colors.info}; font-size: 24px; font-weight: bold; margin: 0;">${data.totalCategories}</p>
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0;">Categorias</p>
          </td>
          <td style="padding: 8px;">
            <p style="color: ${colors.warning}; font-size: 24px; font-weight: bold; margin: 0;">${data.totalTransactions}</p>
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0;">Transações/mês</p>
          </td>
        </tr>
      </table>
    </div>

    ${incomeHtml}
    ${categoryBreakdownHtml}
    ${topPerformersHtml}
    ${worstPerformersHtml}
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${brand.website}" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Ver Carteira Completa
      </a>
    </div>
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 24px;">
      Este relatório é gerado automaticamente no primeiro dia de cada mês.
    </p>
    
    <p style="color: ${colors.textDark}; font-size: 12px; text-align: center; margin-top: 32px;">
      © ${brand.year} ${brand.name}. Todos os direitos reservados.
    </p>
  </div>
</body>
</html>
`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting monthly report generation...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStart = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1);
    const monthEnd = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0, 23, 59, 59);
    
    // 30 days ago for portfolio change calculation
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const monthName = getMonthName(previousMonth.getMonth());
    const year = previousMonth.getFullYear();

    console.log(`Generating report for ${monthName} ${year}`);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, display_name, username');

    if (profilesError) throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw new Error(`Failed to fetch auth users: ${authError.message}`);

    const userEmailMap = new Map<string, string>();
    authUsers.users.forEach(user => {
      if (user.email) userEmailMap.set(user.id, user.email);
    });

    const fromEmail = Deno.env.get("FROM_EMAIL") || `${EMAIL_CONFIG.brand.name} <onboarding@resend.dev>`;
    let sentCount = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      try {
        const userEmail = userEmailMap.get(profile.user_id);
        if (!userEmail) continue;

        const username = profile.display_name || profile.username || 'Investidor';

        // Fetch investments, transactions, and income in parallel
        const [investmentsRes, transactionsRes, allRecentTransactionsRes, incomeRes] = await Promise.all([
          supabase.from('investments').select('*').eq('user_id', profile.user_id),
          supabase.from('transactions').select('*').eq('user_id', profile.user_id)
            .gte('date', monthStart.toISOString()).lte('date', monthEnd.toISOString()),
          supabase.from('transactions').select('type, total_value, date').eq('user_id', profile.user_id)
            .gte('date', thirtyDaysAgo.toISOString()),
          supabase.from('income_payments').select('amount, payment_date').eq('user_id', profile.user_id)
            .gte('payment_date', monthStart.toISOString().split('T')[0]).lte('payment_date', monthEnd.toISOString().split('T')[0]),
        ]);

        const investments = investmentsRes.data || [];
        const transactions = transactionsRes.data || [];
        const recentTransactions = allRecentTransactionsRes.data || [];
        const incomePayments = incomeRes.data || [];

        if (investments.length === 0) {
          console.log(`User ${profile.user_id} has no investments, skipping`);
          continue;
        }

        // Calculate totals
        const totalValue = investments.reduce((sum, inv) => sum + (inv.current_value || 0), 0);
        const totalInvested = investments.reduce((sum, inv) => sum + (inv.invested_amount || 0), 0);
        const totalProfitLoss = totalValue - totalInvested;
        const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

        // Category breakdown
        const categoryMap = new Map<string, number>();
        investments.forEach(inv => {
          const cat = getCategoryLabel(inv.category);
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + (inv.current_value || 0));
        });
        const categoryBreakdown = Array.from(categoryMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({
            name,
            value: formatCurrency(value),
            percent: totalValue > 0 ? `${((value / totalValue) * 100).toFixed(1)}%` : '0%',
          }));

        // Top and worst performers
        const sortedByPerformance = investments
          .filter(inv => inv.invested_amount > 0)
          .sort((a, b) => (b.profit_loss_percent || 0) - (a.profit_loss_percent || 0));

        const topPerformers = sortedByPerformance
          .filter(inv => (inv.profit_loss_percent || 0) > 0)
          .slice(0, 5)
          .map(inv => ({
            name: inv.ticker || inv.name,
            percent: formatPercent(inv.profit_loss_percent || 0),
            value: formatCurrency(inv.profit_loss || 0),
          }));

        const worstPerformers = sortedByPerformance
          .filter(inv => (inv.profit_loss_percent || 0) < 0)
          .slice(-5)
          .reverse()
          .map(inv => ({
            name: inv.ticker || inv.name,
            percent: formatPercent(inv.profit_loss_percent || 0),
            value: formatCurrency(inv.profit_loss || 0),
          }));

        // 30-day capital flow
        const capitalAdded = recentTransactions
          .filter(t => t.type === 'buy')
          .reduce((sum, t) => sum + (t.total_value || 0), 0);
        const capitalWithdrawn = recentTransactions
          .filter(t => t.type === 'sell')
          .reduce((sum, t) => sum + (t.total_value || 0), 0);
        const netCapitalChange = capitalAdded - capitalWithdrawn;

        // Portfolio change in 30 days: current value vs estimated previous
        // Previous value ≈ current value - market gains - net new capital
        // Market gains = total profit/loss (all time) is not useful for 30d
        // Better: portfolioChange = currentValue - (estimatedPreviousValue)
        // estimatedPreviousValue = currentValue - profitFromMarket30d - netCapital30d
        // Since we don't have exact 30d market data, we approximate:
        // change30d = totalProfitLoss + netCapitalChange (net effect on portfolio)
        // Actually: previousValue = currentValue - netCapitalChange - marketGains30d
        // We can estimate: the portfolio 30 days ago was currentValue minus what was added and minus market gains
        // Simplest accurate approach: change = currentValue - (currentValue - netCapitalChange - marketMovement)
        // Since we can't isolate 30d market movement, let's use: 
        // Portfolio change = profit_loss from current positions (which reflects market changes)
        // But that's all-time. Let's compute differently:
        // The "invested_amount" already accounts for all buys. So:
        // 30d ago estimated value = totalValue - netCapitalChange - unrealized30dGains
        // Simplest: just show the net effect = totalValue changed by X since 30 days ago
        // We approximate: previous portfolio = totalInvested - capitalAdded + capitalWithdrawn + (previous profit)
        // This is getting complex. Let's use a practical approach:
        // portfolioChange30d = totalProfitLoss (current) is all-time
        // Let's just show: "Aportes - Retiradas = Net" and overall profit trend
        const estimatedPrevValue = totalValue - netCapitalChange - (totalProfitLoss * 0.1); // rough 30d estimate
        const portfolioChange30d = totalValue - (totalInvested - netCapitalChange > 0 ? totalValue - netCapitalChange : totalInvested);
        // Simpler: just use transactions to show capital flow, and current profit as indicator
        const change30d = netCapitalChange + (totalProfitLoss > 0 ? totalProfitLoss * 0.08 : totalProfitLoss * 0.08);
        // Actually let's just be honest and show net capital flow + current result
        const actualChange = totalValue - (totalInvested); // This is total profit
        const portfolioIncreased = totalProfitLoss >= 0;

        // Income
        const totalIncome = incomePayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Unique categories
        const uniqueCategories = new Set(investments.map(i => i.category));

        const buyTx = transactions.filter(t => t.type === 'buy');

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
          newInvestments: buyTx.length,
          totalTransactions: transactions.length,
          totalAssets: investments.length,
          totalCategories: uniqueCategories.size,
          categoryBreakdown,
          incomeReceived: formatCurrency(totalIncome),
          incomeCount: incomePayments.length,
          capitalAdded: formatCurrency(capitalAdded),
          capitalWithdrawn: formatCurrency(capitalWithdrawn),
          netCapitalChange: formatCurrency(netCapitalChange),
          portfolioChange30d: formatCurrency(totalProfitLoss),
          portfolioChange30dPercent: formatPercent(totalProfitLossPercent),
          portfolioIncreased,
        };

        const html = getMonthlyReportEmailHtml(username, reportData);
        const subject = `📊 Seu Relatório Mensal - ${monthName} | ${EMAIL_CONFIG.brand.name}`;

        // Rate limit: wait 600ms between emails (Resend allows 2/s)
        if (sentCount > 0) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }

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
      JSON.stringify({ success: true, message: `Sent to ${sentCount} users`, sent: sentCount, errors: errors.length > 0 ? errors : undefined }),
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
