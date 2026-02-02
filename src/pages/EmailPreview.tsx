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

// ============================================
// 🎨 CONFIGURAÇÃO CENTRALIZADA (espelha a edge function)
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
    danger: "#ef4444",
    success: "#22c55e",
    info: "#3b82f6",
  },
};

// ============================================
// 📧 TEMPLATES DE EMAIL (preview local)
// ============================================

const getBaseTemplate = (content: string) => {
  const { colors, brand } = EMAIL_CONFIG;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.background}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;">
  <div style="max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="font-size: 28px; font-weight: bold; color: ${colors.primary};">${brand.emoji} ${brand.name}</span>
    </div>
    ${content}
    <p style="color: ${colors.textDark}; font-size: 12px; text-align: center; margin-top: 32px;">
      © ${brand.year} ${brand.name}. Todos os direitos reservados.
    </p>
  </div>
</body>
</html>
`;
};

const getWelcomeEmailHtml = (username: string) => {
  const { colors } = EMAIL_CONFIG;
  return getBaseTemplate(`
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Bem-vindo, ${username}! 🎉
    </h1>
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Estamos muito felizes em tê-lo conosco! Sua conta foi criada com sucesso e você já pode começar a gerenciar seus investimentos.
    </p>
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 18px; font-weight: bold; margin-bottom: 16px;">📊 O que você pode fazer:</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 28px; margin: 0;">✅ Acompanhar todos os seus investimentos em um só lugar</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 28px; margin: 0;">✅ Visualizar gráficos de performance</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 28px; margin: 0;">✅ Monitorar lucros e prejuízos em tempo real</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 28px; margin: 0;">✅ Organizar investimentos com tags personalizadas</p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Acessar Minha Conta
      </a>
    </div>
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 32px;">
      Se você não criou esta conta, por favor ignore este email.
    </p>
  `);
};

const getEmailConfirmationHtml = (username: string) => {
  const { colors } = EMAIL_CONFIG;
  return getBaseTemplate(`
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">✉️</span>
    </div>
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Confirme seu Email
    </h1>
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Para completar seu cadastro, precisamos confirmar seu endereço de email.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Confirmar Email
      </a>
    </div>
    <div style="text-align: center; margin: 16px 0;">
      <p style="color: ${colors.warning}; font-size: 14px; margin: 0;">⏰ Este link expira em 24 horas</p>
    </div>
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 8px;">🛡️ Dica de Segurança</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 22px; margin: 0;">
        Se você não criou uma conta no My Invest, ignore este email.
      </p>
    </div>
  `);
};

const getPasswordResetEmailHtml = (username: string) => {
  const { colors } = EMAIL_CONFIG;
  return getBaseTemplate(`
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">🔐</span>
    </div>
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 24px;">
      Redefinir Senha
    </h1>
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Recebemos uma solicitação para redefinir a senha da sua conta.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Redefinir Minha Senha
      </a>
    </div>
    <div style="text-align: center; margin: 16px 0;">
      <p style="color: ${colors.warning}; font-size: 14px; margin: 0;">⏰ Este link expira em 1 hora</p>
    </div>
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 8px;">🛡️ Dica de Segurança</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 22px; margin: 0;">
        Se você não solicitou esta redefinição de senha, ignore este email. Sua senha permanecerá a mesma.
      </p>
    </div>
  `);
};

const getPlanUpgradeEmailHtml = (username: string, planName: string, planFeatures: string[]) => {
  const { colors } = EMAIL_CONFIG;
  return getBaseTemplate(`
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
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 18px; font-weight: bold; margin-bottom: 16px;">✨ Novos recursos desbloqueados:</p>
      ${planFeatures.map(feature => `<p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 28px; margin: 0;">✅ ${feature}</p>`).join('')}
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Explorar Novos Recursos
      </a>
    </div>
  `);
};

const getSuspiciousLoginEmailHtml = (username: string) => {
  const { colors } = EMAIL_CONFIG;
  return getBaseTemplate(`
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
        <strong>Dispositivo:</strong> Chrome no Windows 11
      </p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 24px; margin: 4px 0;">
        <strong>Local:</strong> São Paulo, Brasil
      </p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 24px; margin: 4px 0;">
        <strong>IP:</strong> 189.xxx.xxx.xxx
      </p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 24px; margin: 4px 0;">
        <strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}
      </p>
    </div>
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Se foi você, pode ignorar este email. Caso contrário, recomendamos que altere sua senha imediatamente.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background-color: ${colors.danger}; border-radius: 8px; color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Proteger Minha Conta
      </a>
    </div>
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 32px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 8px;">🛡️ Dica de Segurança</p>
      <p style="color: ${colors.textSecondary}; font-size: 14px; line-height: 22px; margin: 0;">
        Se você não reconhece esta atividade, altere sua senha imediatamente e revise as sessões ativas na sua conta.
      </p>
    </div>
  `);
};

const getMonthlyReportEmailHtml = (username: string) => {
  const { colors } = EMAIL_CONFIG;
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });
  const currentYear = new Date().getFullYear();
  
  return getBaseTemplate(`
    <div style="text-align: center; margin: 16px 0;">
      <span style="font-size: 48px;">📊</span>
    </div>
    <h1 style="color: ${colors.textPrimary}; font-size: 28px; font-weight: bold; text-align: center; margin: 0 0 8px;">
      Relatório Mensal
    </h1>
    <p style="color: ${colors.textMuted}; font-size: 16px; text-align: center; margin: 0 0 24px;">
      ${currentMonth} de ${currentYear}
    </p>
    <p style="color: ${colors.textSecondary}; font-size: 16px; line-height: 26px; text-align: center;">
      Olá, ${username}! Aqui está o resumo da sua carteira neste mês.
    </p>
    
    <!-- Main Stats -->
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 24px; margin: 32px 0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <p style="color: ${colors.textMuted}; font-size: 14px; margin: 0 0 8px;">Patrimônio Total</p>
        <p style="color: ${colors.primary}; font-size: 32px; font-weight: bold; margin: 0;">R$ 125.847,32</p>
      </div>
      <table style="width: 100%; text-align: center;">
        <tr>
          <td style="padding: 8px;">
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 0 0 4px;">Investido</p>
            <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin: 0;">R$ 100.000,00</p>
          </td>
          <td style="padding: 8px;">
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 0 0 4px;">📈 Resultado</p>
            <p style="color: ${colors.success}; font-size: 16px; font-weight: bold; margin: 0;">
              +R$ 25.847,32 (+25.8%)
            </p>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Activity -->
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">📋 Atividade do Mês</p>
      <table style="width: 100%; text-align: center;">
        <tr>
          <td style="padding: 8px;">
            <p style="color: ${colors.primary}; font-size: 24px; font-weight: bold; margin: 0;">3</p>
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0;">Novos Aportes</p>
          </td>
          <td style="padding: 8px;">
            <p style="color: ${colors.info}; font-size: 24px; font-weight: bold; margin: 0;">12</p>
            <p style="color: ${colors.textMuted}; font-size: 12px; margin: 4px 0 0;">Transações</p>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Top Performers -->
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">🏆 Melhores Performances</p>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${colors.background};">
        <span style="color: ${colors.textSecondary}; font-size: 14px;">Bitcoin (BTC)</span>
        <span style="color: ${colors.success}; font-size: 14px; font-weight: bold;">+45.2%</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${colors.background};">
        <span style="color: ${colors.textSecondary}; font-size: 14px;">PETR4</span>
        <span style="color: ${colors.success}; font-size: 14px; font-weight: bold;">+12.8%</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: ${colors.textSecondary}; font-size: 14px;">HGLG11</span>
        <span style="color: ${colors.success}; font-size: 14px; font-weight: bold;">+8.3%</span>
      </div>
    </div>
    
    <!-- Worst Performers -->
    <div style="background-color: ${colors.cardBg}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: ${colors.textPrimary}; font-size: 16px; font-weight: bold; margin-bottom: 16px;">📉 Atenção Necessária</p>
      <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${colors.background};">
        <span style="color: ${colors.textSecondary}; font-size: 14px;">MGLU3</span>
        <span style="color: ${colors.danger}; font-size: 14px; font-weight: bold;">-15.4%</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: ${colors.textSecondary}; font-size: 14px;">VIIA3</span>
        <span style="color: ${colors.danger}; font-size: 14px; font-weight: bold;">-8.2%</span>
      </div>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" style="background-color: ${colors.primary}; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 14px 32px;">
        Ver Relatório Completo
      </a>
    </div>
    
    <p style="color: ${colors.textMuted}; font-size: 12px; text-align: center; margin-top: 24px;">
      Este relatório é gerado automaticamente no primeiro dia de cada mês.
    </p>
  `);
};

// ============================================
// 📄 COMPONENTE DE PREVIEW
// ============================================

export default function EmailPreview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    sendWelcomeEmail, 
    sendEmailConfirmation,
    sendPasswordResetEmail,
    sendPlanUpgradeEmail, 
    sendSuspiciousLoginEmail,
    sendMonthlyReportEmail
  } = useEmail();
  
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
        return getWelcomeEmailHtml(testUsername);
      case 'confirmation':
        return getEmailConfirmationHtml(testUsername);
      case 'password-reset':
        return getPasswordResetEmailHtml(testUsername);
      case 'upgrade':
        return getPlanUpgradeEmailHtml(testUsername, testPlanName, planFeatures);
      case 'suspicious-login':
        return getSuspiciousLoginEmailHtml(testUsername);
      case 'monthly-report':
        return getMonthlyReportEmailHtml(testUsername);
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
        case 'confirmation':
          result = await sendEmailConfirmation(testEmail, 'https://myinvestapp.lovable.app/auth?confirm=token', testUsername);
          break;
        case 'password-reset':
          result = await sendPasswordResetEmail(testEmail, 'https://myinvestapp.lovable.app/auth?mode=reset', testUsername);
          break;
        case 'upgrade':
          result = await sendPlanUpgradeEmail(testEmail, testPlanName, planFeatures, testUsername);
          break;
        case 'suspicious-login':
          result = await sendSuspiciousLoginEmail(testEmail, {
            device: 'Chrome no Windows 11',
            location: 'São Paulo, Brasil',
            ip: '189.xxx.xxx.xxx',
            time: new Date().toLocaleString('pt-BR'),
          }, testUsername);
          break;
        case 'monthly-report':
          result = await sendMonthlyReportEmail(testEmail, {
            month: new Date().toLocaleString('pt-BR', { month: 'long' }),
            year: new Date().getFullYear(),
            totalValue: 'R$ 125.847,32',
            totalInvested: 'R$ 100.000,00',
            profitLoss: '+R$ 25.847,32',
            profitLossPercent: '+25.8%',
            isPositive: true,
            topPerformers: [
              { name: 'Bitcoin (BTC)', percent: '+45.2%' },
              { name: 'PETR4', percent: '+12.8%' },
              { name: 'HGLG11', percent: '+8.3%' },
            ],
            worstPerformers: [
              { name: 'MGLU3', percent: '-15.4%' },
              { name: 'VIIA3', percent: '-8.2%' },
            ],
            newInvestments: 3,
            totalTransactions: 12,
          }, testUsername);
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

  const tabConfig = [
    { value: 'welcome', label: '✉️ Boas-vindas', description: 'Enviado quando o usuário cria uma conta' },
    { value: 'confirmation', label: '📧 Confirmação', description: 'Enviado para confirmar o email' },
    { value: 'password-reset', label: '🔐 Senha', description: 'Enviado quando o usuário esquece a senha' },
    { value: 'upgrade', label: '🚀 Upgrade', description: 'Enviado quando o usuário faz upgrade' },
    { value: 'suspicious-login', label: '🚨 Alerta', description: 'Enviado quando há login suspeito' },
    { value: 'monthly-report', label: '📊 Relatório', description: 'Enviado mensalmente com resumo da carteira' },
  ];

  const currentTabConfig = tabConfig.find(t => t.value === activeTab);

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

              {/* Template info */}
              <div className="bg-muted/30 border border-border rounded-xl p-4">
                <h4 className="font-medium text-sm mb-2">💡 Como editar os templates</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Para alterar cores, logo ou textos, edite o objeto <code className="bg-muted px-1 rounded">EMAIL_CONFIG</code> no 
                  arquivo <code className="bg-muted px-1 rounded">send-email/index.ts</code>.
                </p>
              </div>
            </div>

            {/* Main - Preview */}
            <div className="space-y-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto">
                  {tabConfig.map(tab => (
                    <TabsTrigger key={tab.value} value={tab.value} className="text-xs py-2">
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {tabConfig.map(tab => (
                  <TabsContent key={tab.value} value={tab.value} className="mt-4">
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                      <div className="bg-muted/50 px-4 py-2 border-b border-border">
                        <p className="text-sm font-medium">{tab.label.replace(/^[^\s]+\s/, '')} Email</p>
                        <p className="text-xs text-muted-foreground">{tab.description}</p>
                      </div>
                      <iframe 
                        srcDoc={getPreviewHtml()}
                        className="w-full h-[700px] bg-[#0a0a0f]"
                        title={`${tab.value} Email Preview`}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}