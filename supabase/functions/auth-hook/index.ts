import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
  },
};

// ============================================
// 🧱 TEMPLATE BASE
// ============================================
const getBaseTemplate = (content: string) => {
  const { colors, brand } = EMAIL_CONFIG;
  
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
      <span style="font-size: 28px; font-weight: bold; color: ${colors.primary};">${brand.emoji} ${brand.name}</span>
    </div>
    
    ${content}
    
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
// 📧 TEMPLATES DE EMAIL
// ============================================

const getRecoveryEmailHtml = (confirmationUrl: string) => {
  const { colors } = EMAIL_CONFIG;
  
  const content = `
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">🔐</span>
    </div>
    
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Redefinir Senha
    </h1>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Recebemos uma solicitação para redefinir a senha da sua conta.
    </p>
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Clique no botão abaixo para criar uma nova senha:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${confirmationUrl}" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Redefinir Minha Senha
      </a>
    </div>
    
    <div style="text-align: center; margin: 16px 0;">
      <p style="color: ${colors.warning}; font-size: 14px; margin: 0;">⏰ Este link expira em 1 hora</p>
    </div>
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 32px; margin-bottom: 8px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="color: ${colors.primary}; font-size: 12px; text-align: center; word-break: break-all;">
      ${confirmationUrl}
    </p>
    
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 8px;">🛡️ Dica de Segurança</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 22px; margin: 0;">
        Se você não solicitou esta redefinição de senha, ignore este email. Sua senha permanecerá a mesma.
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

const getSignupEmailHtml = (confirmationUrl: string) => {
  const { colors } = EMAIL_CONFIG;
  
  const content = `
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">✉️</span>
    </div>
    
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Confirme seu Email
    </h1>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Olá! Para completar seu cadastro no My Invest, precisamos confirmar seu endereço de email.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${confirmationUrl}" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Confirmar Email
      </a>
    </div>
    
    <div style="text-align: center; margin: 16px 0;">
      <p style="color: ${colors.warning}; font-size: 14px; margin: 0;">⏰ Este link expira em 24 horas</p>
    </div>
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 32px; margin-bottom: 8px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="color: ${colors.primary}; font-size: 12px; text-align: center; word-break: break-all;">
      ${confirmationUrl}
    </p>
    
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 8px;">🛡️ Dica de Segurança</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 22px; margin: 0;">
        Se você não criou uma conta no My Invest, ignore este email.
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

const getMagicLinkEmailHtml = (confirmationUrl: string) => {
  const { colors } = EMAIL_CONFIG;
  
  const content = `
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">🔑</span>
    </div>
    
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Seu Link de Acesso
    </h1>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Clique no botão abaixo para acessar sua conta no My Invest:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${confirmationUrl}" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Acessar Minha Conta
      </a>
    </div>
    
    <div style="text-align: center; margin: 16px 0;">
      <p style="color: ${colors.warning}; font-size: 14px; margin: 0;">⏰ Este link expira em 1 hora</p>
    </div>
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 32px; margin-bottom: 8px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="color: ${colors.primary}; font-size: 12px; text-align: center; word-break: break-all;">
      ${confirmationUrl}
    </p>
    
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 8px;">🛡️ Dica de Segurança</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 22px; margin: 0;">
        Se você não solicitou este link, ignore este email. Nunca compartilhe este link com outras pessoas.
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

const getEmailChangeEmailHtml = (confirmationUrl: string) => {
  const { colors } = EMAIL_CONFIG;
  
  const content = `
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">✉️</span>
    </div>
    
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Confirme a Alteração de Email
    </h1>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Recebemos uma solicitação para alterar o email da sua conta no My Invest.
    </p>
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Clique no botão abaixo para confirmar a alteração:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${confirmationUrl}" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Confirmar Novo Email
      </a>
    </div>
    
    <div style="text-align: center; margin: 16px 0;">
      <p style="color: ${colors.warning}; font-size: 14px; margin: 0;">⏰ Este link expira em 24 horas</p>
    </div>
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 32px; margin-bottom: 8px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="color: ${colors.primary}; font-size: 12px; text-align: center; word-break: break-all;">
      ${confirmationUrl}
    </p>
    
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 8px;">🛡️ Dica de Segurança</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 22px; margin: 0;">
        Se você não solicitou esta alteração, ignore este email e sua conta permanecerá com o email atual.
      </p>
    </div>
  `;
  
  return getBaseTemplate(content);
};

const getInviteEmailHtml = (confirmationUrl: string) => {
  const { colors } = EMAIL_CONFIG;
  
  const content = `
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">🎉</span>
    </div>
    
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Você foi convidado!
    </h1>
    
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Você foi convidado para fazer parte do My Invest - a plataforma que vai transformar a forma como você gerencia seus investimentos.
    </p>
    
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 18px; font-weight: bold; margin-bottom: 16px;">📊 O que você pode fazer:</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 28px; margin: 0;">✅ Acompanhar todos os seus investimentos em um só lugar</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 28px; margin: 0;">✅ Visualizar gráficos de performance</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 28px; margin: 0;">✅ Monitorar lucros e prejuízos em tempo real</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 28px; margin: 0;">✅ Organizar investimentos com tags personalizadas</p>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${confirmationUrl}" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Aceitar Convite
      </a>
    </div>
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 32px; margin-bottom: 8px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="color: ${colors.primary}; font-size: 12px; text-align: center; word-break: break-all;">
      ${confirmationUrl}
    </p>
  `;
  
  return getBaseTemplate(content);
};

// ============================================
// 🚀 HANDLER DO AUTH HOOK
// ============================================

interface AuthHookPayload {
  user: {
    id: string;
    email: string;
    user_metadata?: {
      username?: string;
      display_name?: string;
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change';
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AuthHookPayload = await req.json();
    
    console.log("Auth Hook received:", JSON.stringify({
      email: payload.user?.email,
      action_type: payload.email_data?.email_action_type,
    }));

    const { user, email_data } = payload;
    
    if (!user?.email || !email_data) {
      console.error("Missing user email or email_data");
      return new Response(
        JSON.stringify({ error: "Missing required data" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build the confirmation URL
    const baseUrl = email_data.site_url || "https://myinvestapp.lovable.app";
    const redirectTo = email_data.redirect_to || `${baseUrl}/auth`;
    
    // Build confirmation URL with token
    let confirmationUrl: string;
    if (email_data.email_action_type === 'email_change' && email_data.token_hash_new) {
      confirmationUrl = `${baseUrl}/auth/confirm?token_hash=${email_data.token_hash}&type=${email_data.email_action_type}&next=${encodeURIComponent(redirectTo)}`;
    } else {
      confirmationUrl = `${baseUrl}/auth/confirm?token_hash=${email_data.token_hash}&type=${email_data.email_action_type}&next=${encodeURIComponent(redirectTo)}`;
    }

    let html: string;
    let subject: string;
    const brandName = EMAIL_CONFIG.brand.name;

    switch (email_data.email_action_type) {
      case 'recovery':
        subject = `Redefinição de Senha - ${brandName} 🔐`;
        html = getRecoveryEmailHtml(confirmationUrl);
        break;
        
      case 'signup':
        subject = `Confirme seu Email - ${brandName} ✉️`;
        html = getSignupEmailHtml(confirmationUrl);
        break;
        
      case 'magiclink':
        subject = `Seu Link de Acesso - ${brandName} 🔑`;
        html = getMagicLinkEmailHtml(confirmationUrl);
        break;
        
      case 'email_change':
        subject = `Confirme a Alteração de Email - ${brandName} ✉️`;
        html = getEmailChangeEmailHtml(confirmationUrl);
        break;
        
      case 'invite':
        subject = `Você foi convidado - ${brandName} 💰`;
        html = getInviteEmailHtml(confirmationUrl);
        break;
        
      default:
        console.log(`Unknown email action type: ${email_data.email_action_type}`);
        // Return success to let Supabase handle unknown types
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    const fromEmail = Deno.env.get("FROM_EMAIL") || `${brandName} <onboarding@resend.dev>`;

    const emailResponse = await resend.emails.send({
      from: fromEmail,
      to: [user.email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in auth-hook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
