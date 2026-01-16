import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Send, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useEmail } from '@/hooks/useEmail';

// Templates HTML (same as edge function)
const getWelcomeEmailHtml = (username: string, loginUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 28px; font-weight: bold; color: #22c55e;">💰 My Invest</span>
    </div>
    <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Bem-vindo, ${username}! 🎉
    </h1>
    <p style="color: #a1a1aa; font-size: 16px; line-height: 26px; text-align: center;">
      Estamos muito felizes em tê-lo conosco! Sua conta foi criada com sucesso e você já pode começar a gerenciar seus investimentos.
    </p>
    <div style="background-color: #18181b; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin-bottom: 16px;">O que você pode fazer:</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 24px; margin: 8px 0;">📊 Acompanhar todos os seus investimentos em um só lugar</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 24px; margin: 8px 0;">📈 Visualizar gráficos de performance</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 24px; margin: 8px 0;">💹 Monitorar lucros e prejuízos em tempo real</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 24px; margin: 8px 0;">🏷️ Organizar investimentos com tags personalizadas</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginUrl}" style="background-color: #22c55e; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Acessar Minha Conta
      </a>
    </div>
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

const getPlanUpgradeEmailHtml = (username: string, planName: string, planFeatures: string[]) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 28px; font-weight: bold; color: #22c55e;">💰 My Invest</span>
    </div>
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 64px;">🚀</span>
    </div>
    <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Upgrade Confirmado!
    </h1>
    <p style="color: #a1a1aa; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Parabéns pela sua decisão de investir no seu futuro financeiro.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <span style="display: inline-block; background-color: #22c55e; color: #000000; font-size: 20px; font-weight: bold; padding: 12px 32px; border-radius: 50px;">
        ${planName}
      </span>
      <p style="color: #71717a; font-size: 14px; margin-top: 12px;">Seu novo plano está ativo</p>
    </div>
    <div style="background-color: #18181b; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="color: #ffffff; font-size: 18px; font-weight: bold; margin-bottom: 16px;">Novos recursos desbloqueados:</p>
      ${planFeatures.map(feature => `<p style="color: #a1a1aa; font-size: 14px; line-height: 28px; margin: 0;">✅ ${feature}</p>`).join('')}
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background-color: #22c55e; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Explorar Novos Recursos
      </a>
    </div>
    <p style="color: #71717a; font-size: 14px; text-align: center; margin-top: 32px;">
      Precisa de ajuda? Responda este email e nossa equipe entrará em contato.
    </p>
    <p style="color: #52525b; font-size: 12px; text-align: center; margin-top: 24px;">
      © 2024 My Invest. Todos os direitos reservados.
    </p>
  </div>
</body>
</html>
`;

const getPasswordResetEmailHtml = (username: string, resetUrl: string, expiresIn: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="font-size: 28px; font-weight: bold; color: #22c55e;">💰 My Invest</span>
    </div>
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">🔐</span>
    </div>
    <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Redefinir Senha
    </h1>
    <p style="color: #a1a1aa; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Recebemos uma solicitação para redefinir a senha da sua conta.
    </p>
    <p style="color: #a1a1aa; font-size: 16px; line-height: 26px; text-align: center;">
      Clique no botão abaixo para criar uma nova senha:
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="background-color: #22c55e; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Redefinir Minha Senha
      </a>
    </div>
    <div style="text-align: center; margin: 16px 0;">
      <p style="color: #fbbf24; font-size: 14px; margin: 0;">⏰ Este link expira em ${expiresIn}</p>
    </div>
    <p style="color: #71717a; font-size: 12px; text-align: center; margin-top: 32px; margin-bottom: 8px;">
      Se o botão não funcionar, copie e cole este link no seu navegador:
    </p>
    <p style="color: #22c55e; font-size: 12px; text-align: center; word-break: break-all;">
      ${resetUrl}
    </p>
    <div style="background-color: #18181b; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: #ffffff; font-size: 16px; font-weight: bold; margin-bottom: 8px;">🛡️ Dica de Segurança</p>
      <p style="color: #a1a1aa; font-size: 14px; line-height: 22px; margin: 0;">
        Se você não solicitou esta redefinição de senha, ignore este email. Sua senha permanecerá a mesma.
      </p>
    </div>
    <p style="color: #52525b; font-size: 12px; text-align: center; margin-top: 32px;">
      © 2024 My Invest. Todos os direitos reservados.
    </p>
  </div>
</body>
</html>
`;

export default function EmailPreview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendWelcomeEmail, sendPlanUpgradeEmail, sendPasswordResetEmail } = useEmail();
  
  const [testEmail, setTestEmail] = useState('');
  const [testUsername, setTestUsername] = useState('João');
  const [testPlanName, setTestPlanName] = useState('Premium');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState('welcome');

  const planFeatures = [
    'Análises avançadas de portfólio',
    'Alertas de preço personalizados',
    'Relatórios detalhados mensais',
    'Suporte prioritário'
  ];

  const getPreviewHtml = () => {
    switch (activeTab) {
      case 'welcome':
        return getWelcomeEmailHtml(testUsername, 'https://myinvestapp.lovable.app/auth');
      case 'upgrade':
        return getPlanUpgradeEmailHtml(testUsername, testPlanName, planFeatures);
      case 'password-reset':
        return getPasswordResetEmailHtml(testUsername, 'https://myinvestapp.lovable.app/auth?mode=reset', '1 hora');
      default:
        return '';
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast({
        variant: 'destructive',
        title: 'E-mail obrigatório',
        description: 'Informe um e-mail para enviar o teste.',
      });
      return;
    }

    setIsSending(true);
    try {
      let result;
      switch (activeTab) {
        case 'welcome':
          result = await sendWelcomeEmail(testEmail, testUsername);
          break;
        case 'upgrade':
          result = await sendPlanUpgradeEmail(testEmail, testPlanName, planFeatures, testUsername);
          break;
        case 'password-reset':
          result = await sendPasswordResetEmail(testEmail, 'https://myinvestapp.lovable.app/auth?mode=reset', testUsername);
          break;
      }

      if (result?.success) {
        toast({
          title: 'Email enviado!',
          description: `Email de teste enviado para ${testEmail}`,
        });
      } else {
        throw new Error(result?.error?.message || 'Erro ao enviar email');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: error.message || 'Não foi possível enviar o email de teste.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Preview de Emails - My Invest</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold">Preview de Emails</h1>
                  <p className="text-xs text-muted-foreground">Visualize e teste os templates</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-[300px,1fr] gap-6">
            {/* Sidebar - Settings */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Configurações do Preview
                </h3>
                
                <div className="space-y-2">
                  <Label>Nome do usuário</Label>
                  <Input 
                    value={testUsername} 
                    onChange={(e) => setTestUsername(e.target.value)}
                    placeholder="Nome para exibir"
                  />
                </div>

                {activeTab === 'upgrade' && (
                  <div className="space-y-2">
                    <Label>Nome do plano</Label>
                    <Input 
                      value={testPlanName} 
                      onChange={(e) => setTestPlanName(e.target.value)}
                      placeholder="Ex: Premium, Pro"
                    />
                  </div>
                )}
              </div>

              <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Enviar Email de Teste
                </h3>
                
                <div className="space-y-2">
                  <Label>E-mail de destino</Label>
                  <Input 
                    type="email"
                    value={testEmail} 
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Com o domínio de teste do Resend, só é possível enviar para o email cadastrado na conta.
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSendTestEmail}
                  disabled={isSending}
                >
                  {isSending ? 'Enviando...' : 'Enviar Email de Teste'}
                </Button>
              </div>
            </div>

            {/* Main - Preview */}
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="welcome">✉️ Boas-vindas</TabsTrigger>
                  <TabsTrigger value="upgrade">🚀 Upgrade</TabsTrigger>
                  <TabsTrigger value="password-reset">🔐 Senha</TabsTrigger>
                </TabsList>

                <TabsContent value="welcome" className="mt-4">
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium">Email de Boas-vindas</p>
                      <p className="text-xs text-muted-foreground">Enviado quando o usuário cria uma conta</p>
                    </div>
                    <iframe 
                      srcDoc={getPreviewHtml()}
                      className="w-full h-[600px] bg-[#0a0a0f]"
                      title="Welcome Email Preview"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="upgrade" className="mt-4">
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium">Email de Upgrade de Plano</p>
                      <p className="text-xs text-muted-foreground">Enviado quando o usuário faz upgrade</p>
                    </div>
                    <iframe 
                      srcDoc={getPreviewHtml()}
                      className="w-full h-[700px] bg-[#0a0a0f]"
                      title="Plan Upgrade Email Preview"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="password-reset" className="mt-4">
                  <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b border-border">
                      <p className="text-sm font-medium">Email de Recuperação de Senha</p>
                      <p className="text-xs text-muted-foreground">Enviado quando o usuário esquece a senha</p>
                    </div>
                    <iframe 
                      srcDoc={getPreviewHtml()}
                      className="w-full h-[700px] bg-[#0a0a0f]"
                      title="Password Reset Email Preview"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
