import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// 🎨 CONFIGURAÇÃO CENTRALIZADA DO EMAIL
// Edite aqui para personalizar todos os emails
// ============================================
const EMAIL_CONFIG = {
  // Informações da marca
  brand: {
    name: "My Invest",
    emoji: "💰",
    tagline: "Gerencie seus investimentos com inteligência",
    year: new Date().getFullYear(),
    website: "https://myinvestapp.lovable.app",
  },
  
  // URLs padrão
  urls: {
    login: "https://myinvestapp.lovable.app/auth",
    dashboard: "https://myinvestapp.lovable.app",
    support: "mailto:suporte@myinvest.app",
  },
  
  // Cores (formato HEX)
  colors: {
    primary: "#22c55e",        // Verde principal
    primaryDark: "#16a34a",    // Verde escuro (hover)
    background: "#0a0a0f",     // Fundo escuro
    cardBg: "#18181b",         // Fundo dos cards
    textPrimary: "#ffffff",    // Texto principal
    textSecondary: "#a1a1aa",  // Texto secundário
    textMuted: "#71717a",      // Texto apagado
    textDark: "#52525b",       // Texto muito apagado
    warning: "#fbbf24",        // Amarelo de alerta
    danger: "#ef4444",         // Vermelho de perigo
    success: "#22c55e",        // Verde de sucesso
    info: "#3b82f6",           // Azul de info
  },
  
  // Logo (pode ser URL de imagem ou null para usar emoji)
  logo: {
    url: null as string | null, // Ex: "https://myinvestapp.lovable.app/logo.png"
    width: "120",
    height: "40",
  },
  
  // Textos padrão
  texts: {
    footer: "Se você não solicitou este email, por favor ignore.",
    copyright: (year: number, name: string) => `© ${year} ${name}. Todos os direitos reservados.`,
    helpText: "Precisa de ajuda? Responda este email e nossa equipe entrará em contato.",
  },
};

// ============================================
// 🧱 COMPONENTES BASE DO TEMPLATE
// ============================================

const getLogoHtml = () => {
  const { brand, colors, logo } = EMAIL_CONFIG;
  
  if (logo.url) {
    return `<img src="${logo.url}" alt="${brand.name}" width="${logo.width}" height="${logo.height}" style="display: block; margin: 0 auto;" />`;
  }
  
  return `<span style="font-size: 28px; font-weight: bold; color: ${colors.primary};">${brand.emoji} ${brand.name}</span>`;
};

const getBaseTemplate = (content: string) => {
  const { colors, brand, texts } = EMAIL_CONFIG;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand.name}</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      ${getLogoHtml()}
    </div>
    
    ${content}
    
    <!-- Footer -->
    <p style="color: ${colors.textDark}; font-size: 12px; text-align: center; margin-top: 32px;">
      ${texts.copyright(brand.year, brand.name)}
    </p>
  </div>
</body>
</html>
`;
};

const getButtonHtml = (text: string, url: string, variant: 'primary' | 'danger' = 'primary') => {
  const { colors } = EMAIL_CONFIG;
  const bgColor = variant === 'danger' ? colors.danger : colors.primary;
  const textColor = variant === 'danger' ? colors.textPrimary : "#000000";
  
  return `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${url}" style="background-color: ${bgColor}; border-radius: 8px; color: ${textColor}; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        ${text}
      </a>
    </div>
  `;
};

const getInfoBoxHtml = (title: string, items: string[], icon: string = "📋") => {
  const { colors } = EMAIL_CONFIG;
  
  return `
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 18px; font-weight: bold; margin-bottom: 16px;">${icon} ${title}</p>
      ${items.map(item => `<p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 28px; margin: 0;">✅ ${item}</p>`).join('')}
    </div>
  `;
};

const getWarningBoxHtml = (title: string, message: string, icon: string = "⚠️") => {
  const { colors } = EMAIL_CONFIG;
  
  return `
    <div style="background-color: ${colors.cardBg}; border: 1px solid ${colors.warning}; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: ${colors.warning}; font-size: 16px; font-weight: bold; margin-bottom: 8px;">${icon} ${title}</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 22px; margin: 0;">
        ${message}
      </p>
    </div>
  `;
};

const getSecurityBoxHtml = (message: string) => {
  const { colors } = EMAIL_CONFIG;
  
  return `
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 8px;">🛡️ Dica de Segurança</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 22px; margin: 0;">
        ${message}
      </p>
    </div>
  `;
};

// ============================================
// 📧 TEMPLATES DE EMAIL
// ============================================

// 1. Welcome Email
const getWelcomeEmailHtml = (username: string, loginUrl: string) => {
  const { colors, texts } = EMAIL_CONFIG;
  
  const content = `
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Bem-vindo, ${username}! 🎉
    </h1>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Estamos muito felizes em tê-lo conosco! Sua conta foi criada com sucesso e você já pode começar a gerenciar seus investimentos.
    </p>
    
    ${getInfoBoxHtml("O que você pode fazer:", [
      "Acompanhar todos os seus investimentos em um só lugar",
      "Visualizar gráficos de performance",
      "Monitorar lucros e prejuízos em tempo real",
      "Organizar investimentos com tags personalizadas"
    ], "📊")}
    
    ${getButtonHtml("Acessar Minha Conta", loginUrl)}
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 32px;">
      ${texts.footer}
    </p>
  `;
  
  return getBaseTemplate(content);
};

// 2. Email Confirmation
const getEmailConfirmationHtml = (username: string, confirmUrl: string, expiresIn: string) => {
  const { colors } = EMAIL_CONFIG;
  
  const content = `
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">✉️</span>
    </div>
    
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Confirme seu Email
    </h1>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Para completar seu cadastro, precisamos confirmar seu endereço de email.
    </p>
    
    ${getButtonHtml("Confirmar Email", confirmUrl)}
    
    <div style="text-align: center; margin: 16px 0;">
      <p style="color: ${colors.warning}; font-size: 14px; margin: 0;">⏰ Este link expira em ${expiresIn}</p>
    </div>
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 32px; margin-bottom: 8px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="color: ${colors.primary}; font-size: 12px; text-align: center; word-break: break-all;">
      ${confirmUrl}
    </p>
    
    ${getSecurityBoxHtml("Se você não criou uma conta no My Invest, ignore este email.")}
  `;
  
  return getBaseTemplate(content);
};

// 3. Password Reset
const getPasswordResetEmailHtml = (username: string, resetUrl: string, expiresIn: string) => {
  const { colors } = EMAIL_CONFIG;
  
  const content = `
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">🔐</span>
    </div>
    
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Redefinir Senha
    </h1>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Recebemos uma solicitação para redefinir a senha da sua conta.
    </p>
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Clique no botão abaixo para criar uma nova senha:
    </p>
    
    ${getButtonHtml("Redefinir Minha Senha", resetUrl)}
    
    <div style="text-align: center; margin: 16px 0;">
      <p style="color: ${colors.warning}; font-size: 14px; margin: 0;">⏰ Este link expira em ${expiresIn}</p>
    </div>
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 32px; margin-bottom: 8px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="color: ${colors.primary}; font-size: 12px; text-align: center; word-break: break-all;">
      ${resetUrl}
    </p>
    
    ${getSecurityBoxHtml("Se você não solicitou esta redefinição de senha, ignore este email. Sua senha permanecerá a mesma.")}
  `;
  
  return getBaseTemplate(content);
};

// 4. Plan Upgrade
const getPlanUpgradeEmailHtml = (username: string, planName: string, planFeatures: string[], dashboardUrl: string) => {
  const { colors, texts } = EMAIL_CONFIG;
  
  const content = `
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 64px;">🚀</span>
    </div>
    
    <h1 style="color: ${colors.textPrimary}; font-size: 32px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Upgrade Confirmado!
    </h1>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Parabéns pela sua decisão de investir no seu futuro financeiro.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <span style="display: inline-block; background-color: ${colors.primary}; color: #000000; font-size: 20px; font-weight: bold; padding: 12px 32px; border-radius: 50px;">
        ${planName}
      </span>
      <p style="color: ${colors.textMuted}; font-size: 14px; margin-top: 12px;">Seu novo plano está ativo</p>
    </div>
    
    ${getInfoBoxHtml("Novos recursos desbloqueados:", planFeatures, "✨")}
    
    ${getButtonHtml("Explorar Novos Recursos", dashboardUrl)}
    
    <p style="color: ${colors.textMuted}; font-size: 14px; text-align: center; margin-top: 32px;">
      ${texts.helpText}
    </p>
  `;
  
  return getBaseTemplate(content);
};

// 5. Suspicious Login Alert
const getSuspiciousLoginEmailHtml = (
  username: string, 
  loginDetails: { device: string; location: string; ip: string; time: string },
  secureAccountUrl: string
) => {
  const { colors } = EMAIL_CONFIG;
  
  const content = `
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">🚨</span>
    </div>
    
    <h1 style="color: ${colors.danger}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Alerta de Segurança
    </h1>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Detectamos um login na sua conta de um dispositivo ou local não reconhecido.
    </p>
    
    <div style="background-color: ${colors.cardBg}; border: 1px solid ${colors.danger}; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">📍 Detalhes do Login:</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 24px; margin: 4px 0;">
        <strong>Dispositivo:</strong> ${loginDetails.device}
      </p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 24px; margin: 4px 0;">
        <strong>Local:</strong> ${loginDetails.location}
      </p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 24px; margin: 4px 0;">
        <strong>IP:</strong> ${loginDetails.ip}
      </p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 24px; margin: 4px 0;">
        <strong>Data/Hora:</strong> ${loginDetails.time}
      </p>
    </div>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Se foi você, pode ignorar este email. Caso contrário, recomendamos que altere sua senha imediatamente.
    </p>
    
    ${getButtonHtml("Proteger Minha Conta", secureAccountUrl, 'danger')}
    
    ${getSecurityBoxHtml("Se você não reconhece esta atividade, altere sua senha imediatamente e revise as sessões ativas na sua conta.")}
  `;
  
  return getBaseTemplate(content);
};

// 6. Monthly Report
const getMonthlyReportEmailHtml = (
  username: string,
  reportData: {
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
  },
  dashboardUrl: string
) => {
  const { colors } = EMAIL_CONFIG;
  
  const profitColor = reportData.isPositive ? colors.success : colors.danger;
  const profitIcon = reportData.isPositive ? "📈" : "📉";
  
  const content = `
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">📊</span>
    </div>
    
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 8px;">
      Relatório Mensal
    </h1>
    <p style="color: ${colors.textMuted}; font-size: 16px; text-align: center; margin: 0 0 24px;">
      ${reportData.month} de ${reportData.year}
    </p>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Aqui está o resumo da sua carteira neste mês.
    </p>
    
    <!-- Main Stats -->
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: ${colors.textMuted}; font-size: 14px; margin: 0 0 8px;">Patrimônio Total</p>
        <p style="color: ${colors.primary}; font-size: 32px; font-weight: bold; margin: 0;">${reportData.totalValue}</p>
      </div>
      
      <div style="display: flex; justify-content: space-around; text-align: center;">
        <div>
          <p style="color: ${colors.textMuted}; font-size: 12px; margin: 0 0 4px;">Investido</p>
          <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin: 0;">${reportData.totalInvested}</p>
        </div>
        <div>
          <p style="color: ${colors.textMuted}; font-size: 12px; margin: 0 0 4px;">${profitIcon} Resultado</p>
          <p style="color: ${profitColor}; font-size: 16px; font-weight: bold; margin: 0;">
            ${reportData.profitLoss} (${reportData.profitLossPercent})
          </p>
        </div>
      </div>
    </div>
    
    <!-- Activity Summary -->
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">📋 Atividade do Mês</p>
      <div style="display: flex; justify-content: space-around; text-align: center;">
        <div>
          <p style="color: ${colors.primary}; font-size: 24px; font-weight: bold; margin: 0;">${reportData.newInvestments}</p>
          <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0;">Novos Aportes</p>
        </div>
        <div>
          <p style="color: ${colors.info}; font-size: 24px; font-weight: bold; margin: 0;">${reportData.totalTransactions}</p>
          <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0;">Transações</p>
        </div>
      </div>
    </div>
    
    <!-- Top Performers -->
    ${reportData.topPerformers.length > 0 ? `
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">🏆 Melhores Performances</p>
      ${reportData.topPerformers.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${colors.background};">
          <span style="color: ${colors.textSecondary}; font-size: 14px;">${item.name}</span>
          <span style="color: ${colors.success}; font-size: 14px; font-weight: bold;">${item.percent}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- Worst Performers -->
    ${reportData.worstPerformers.length > 0 ? `
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">📉 Atenção Necessária</p>
      ${reportData.worstPerformers.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${colors.background};">
          <span style="color: ${colors.textSecondary}; font-size: 14px;">${item.name}</span>
          <span style="color: ${colors.danger}; font-size: 14px; font-weight: bold;">${item.percent}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    ${getButtonHtml("Ver Relatório Completo", dashboardUrl)}
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 24px;">
      Este relatório é gerado automaticamente no primeiro dia de cada mês.
    </p>
  `;
  
  return getBaseTemplate(content);
};

// ============================================
// 🚀 HANDLER PRINCIPAL
// ============================================

interface EmailRequest {
  type: 'welcome' | 'email-confirmation' | 'password-reset' | 'plan-upgrade' | 'suspicious-login' | 'monthly-report';
  to: string;
  data: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();
    
    console.log(`Sending ${type} email to ${to}`);
    
    let html: string;
    let subject: string;
    
    const { brand, urls } = EMAIL_CONFIG;
    
    switch (type) {
      case 'welcome':
        subject = `Bem-vindo ao ${brand.name}! 🎉`;
        html = getWelcomeEmailHtml(
          data.username || 'Investidor',
          data.loginUrl || urls.login
        );
        break;
        
      case 'email-confirmation':
        subject = `Confirme seu email - ${brand.name} ✉️`;
        html = getEmailConfirmationHtml(
          data.username || 'Investidor',
          data.confirmUrl || '#',
          data.expiresIn || '24 horas'
        );
        break;
        
      case 'password-reset':
        subject = `Redefinição de Senha - ${brand.name} 🔐`;
        html = getPasswordResetEmailHtml(
          data.username || 'Investidor',
          data.resetUrl || '#',
          data.expiresIn || '1 hora'
        );
        break;
        
      case 'plan-upgrade':
        subject = `Parabéns! Seu plano foi atualizado para ${data.planName} 🚀`;
        html = getPlanUpgradeEmailHtml(
          data.username || 'Investidor',
          data.planName || 'Premium',
          data.planFeatures || [
            'Análises avançadas de portfólio',
            'Alertas de preço personalizados',
            'Relatórios detalhados mensais',
            'Suporte prioritário'
          ],
          data.dashboardUrl || urls.dashboard
        );
        break;
        
      case 'suspicious-login':
        subject = `⚠️ Alerta de Segurança - ${brand.name}`;
        html = getSuspiciousLoginEmailHtml(
          data.username || 'Investidor',
          {
            device: data.device || 'Dispositivo desconhecido',
            location: data.location || 'Local desconhecido',
            ip: data.ip || 'IP não disponível',
            time: data.time || new Date().toLocaleString('pt-BR'),
          },
          data.secureAccountUrl || urls.login
        );
        break;
        
      case 'monthly-report':
        const month = data.month || new Date().toLocaleString('pt-BR', { month: 'long' });
        subject = `📊 Seu Relatório Mensal - ${month} | ${brand.name}`;
        html = getMonthlyReportEmailHtml(
          data.username || 'Investidor',
          {
            month: data.month || month,
            year: data.year || new Date().getFullYear(),
            totalValue: data.totalValue || 'R$ 0,00',
            totalInvested: data.totalInvested || 'R$ 0,00',
            profitLoss: data.profitLoss || 'R$ 0,00',
            profitLossPercent: data.profitLossPercent || '0%',
            isPositive: data.isPositive ?? true,
            topPerformers: data.topPerformers || [],
            worstPerformers: data.worstPerformers || [],
            newInvestments: data.newInvestments || 0,
            totalTransactions: data.totalTransactions || 0,
          },
          data.dashboardUrl || urls.dashboard
        );
        break;
        
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const fromEmail = Deno.env.get("FROM_EMAIL") || `${brand.name} <onboarding@resend.dev>`;

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);