import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'welcome' | 'plan-upgrade' | 'password-reset';
  to: string;
  data: Record<string, any>;
}

// Welcome Email Template
const getWelcomeEmailHtml = (username: string, loginUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 28px; font-weight: bold; color: #22c55e;">💰 My Invest</span>
    </div>
    
    <!-- Heading -->
    <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Bem-vindo, ${username}! 🎉
    </h1>
    
    <!-- Text -->
    <p style="color: #a1a1aa; font-size: 16px; line-height: 26px; text-align: center;">
      Estamos muito felizes em tê-lo conosco! Sua conta foi criada com sucesso e você já pode começar a gerenciar seus investimentos.
    </p>
    
    <!-- Features Box -->
    <div style="background-color: #18181b; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin-bottom: 16px;">O que você pode fazer:</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 24px; margin: 8px 0;">📊 Acompanhar todos os seus investimentos em um só lugar</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 24px; margin: 8px 0;">📈 Visualizar gráficos de performance</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 24px; margin: 8px 0;">💹 Monitorar lucros e prejuízos em tempo real</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 24px; margin: 8px 0;">🏷️ Organizar investimentos com tags personalizadas</p>
    </div>
    
    <!-- Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginUrl}" style="background-color: #22c55e; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Acessar Minha Conta
      </a>
    </div>
    
    <!-- Footer -->
    <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 32px;">
      Se você não criou esta conta, por favor ignore este email.
    </p>
    <p style="color: #52525b; font-size: 12px; text-align: center; margin-top: 16px;">
      © 2024 My Invest. Todos os direitos reservados.
    </p>
  </div>
</body>
</html>
`;

// Plan Upgrade Email Template
const getPlanUpgradeEmailHtml = (username: string, planName: string, planFeatures: string[], dashboardUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 28px; font-weight: bold; color: #22c55e;">💰 My Invest</span>
    </div>
    
    <!-- Celebration Emoji -->
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 64px;">🚀</span>
    </div>
    
    <!-- Heading -->
    <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Upgrade Confirmado!
    </h1>
    
    <!-- Text -->
    <p style="color: #a1a1aa; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Parabéns pela sua decisão de investir no seu futuro financeiro.
    </p>
    
    <!-- Plan Badge -->
    <div style="text-align: center; margin: 32px 0;">
      <span style="display: inline-block; background-color: #22c55e; color: #000000; font-size: 20px; font-weight: bold; padding: 12px 32px; border-radius: 50px;">
        ${planName}
      </span>
      <p style="color: #71717a; font-size: 14px; margin-top: 12px;">Seu novo plano está ativo</p>
    </div>
    
    <!-- Features Box -->
    <div style="background-color: #18181b; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin-bottom: 16px;">Novos recursos desbloqueados:</p>
      ${planFeatures.map(feature => `<p style="color: #a1a1aa; font-size: 14px; line-height: 28px; margin: 0;">✅ ${feature}</p>`).join('')}
    </div>
    
    <!-- Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" style="background-color: #22c55e; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Explorar Novos Recursos
      </a>
    </div>
    
    <!-- Support -->
    <p style="color: #71717a; font-size: 14px; text-align: center; margin-top: 32px;">
      Precisa de ajuda? Responda este email e nossa equipe entrará em contato.
    </p>
    
    <!-- Footer -->
    <p style="color: #52525b; font-size: 12px; text-align: center; margin-top: 24px;">
      © 2024 My Invest. Todos os direitos reservados.
    </p>
  </div>
</body>
</html>
`;

// Password Reset Email Template
const getPasswordResetEmailHtml = (username: string, resetUrl: string, expiresIn: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 28px; font-weight: bold; color: #22c55e;">💰 My Invest</span>
    </div>
    
    <!-- Lock Icon -->
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">🔐</span>
    </div>
    
    <!-- Heading -->
    <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Redefinir Senha
    </h1>
    
    <!-- Text -->
    <p style="color: #a1a1aa; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Recebemos uma solicitação para redefinir a senha da sua conta.
    </p>
    <p style="color: #a1a1aa; font-size: 16px; line-height: 26px; text-align: center;">
      Clique no botão abaixo para criar uma nova senha:
    </p>
    
    <!-- Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="background-color: #22c55e; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Redefinir Minha Senha
      </a>
    </div>
    
    <!-- Warning -->
    <div style="text-align: center; margin: 16px 0;">
      <p style="color: #fbbf24; font-size: 14px; margin: 0;">⏰ Este link expira em ${expiresIn}</p>
    </div>
    
    <!-- Alternative Link -->
    <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 32px; margin-bottom: 8px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="color: #22c55e; font-size: 12px; text-align: center; word-break: break-all;">
      ${resetUrl}
    </p>
    
    <!-- Security Box -->
    <div style="background-color: #18181b; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: #ffffff; font-size: 16px; font-weight: bold; margin-bottom: 8px;">🛡️ Dica de Segurança</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 22px; margin: 0;">
        Se você não solicitou esta redefinição de senha, ignore este email. Sua senha permanecerá a mesma.
      </p>
    </div>
    
    <!-- Footer -->
    <p style="color: #52525b; font-size: 12px; text-align: center; margin-top: 32px;">
      © 2024 My Invest. Todos os direitos reservados.
    </p>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();
    
    console.log(`Sending ${type} email to ${to}`);
    
    let html: string;
    let subject: string;
    
    switch (type) {
      case 'welcome':
        subject = 'Bem-vindo ao My Invest! 🎉';
        html = getWelcomeEmailHtml(
          data.username || 'Investidor',
          data.loginUrl || 'https://myinvestapp.lovable.app/auth'
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
          data.dashboardUrl || 'https://myinvestapp.lovable.app'
        );
        break;
        
      case 'password-reset':
        subject = 'Redefinição de Senha - My Invest 🔐';
        html = getPasswordResetEmailHtml(
          data.username || 'Investidor',
          data.resetUrl || '#',
          data.expiresIn || '1 hora'
        );
        break;
        
      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    // Use onboarding@resend.dev for testing, or your verified domain
    const fromEmail = Deno.env.get("FROM_EMAIL") || "My Invest <onboarding@resend.dev>";

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
