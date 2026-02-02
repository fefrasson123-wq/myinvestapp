import { supabase } from '@/integrations/supabase/client';

type EmailType = 'welcome' | 'email-confirmation' | 'password-reset' | 'plan-upgrade' | 'suspicious-login' | 'monthly-report';

interface LoginDetails {
  device: string;
  location: string;
  ip: string;
  time: string;
}

interface MonthlyReportData {
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

interface EmailData {
  username?: string;
  loginUrl?: string;
  confirmUrl?: string;
  planName?: string;
  planFeatures?: string[];
  dashboardUrl?: string;
  resetUrl?: string;
  secureAccountUrl?: string;
  expiresIn?: string;
  device?: string;
  location?: string;
  ip?: string;
  time?: string;
  month?: string;
  year?: number;
  totalValue?: string;
  totalInvested?: string;
  profitLoss?: string;
  profitLossPercent?: string;
  isPositive?: boolean;
  topPerformers?: { name: string; percent: string }[];
  worstPerformers?: { name: string; percent: string }[];
  newInvestments?: number;
  totalTransactions?: number;
}

export const useEmail = () => {
  const sendEmail = async (type: EmailType, to: string, data: EmailData) => {
    try {
      const { data: response, error } = await supabase.functions.invoke('send-email', {
        body: { type, to, data }
      });

      if (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
      }

      console.log(`Email ${type} sent successfully to ${to}`);
      return { success: true, data: response };
    } catch (err) {
      console.error('Failed to send email:', err);
      return { success: false, error: err };
    }
  };

  const sendWelcomeEmail = async (email: string, username?: string) => {
    return sendEmail('welcome', email, {
      username: username || 'Investidor',
      loginUrl: `${window.location.origin}/auth`
    });
  };

  const sendEmailConfirmation = async (email: string, confirmUrl: string, username?: string) => {
    return sendEmail('email-confirmation', email, {
      username: username || 'Investidor',
      confirmUrl,
      expiresIn: '24 horas'
    });
  };

  const sendPasswordResetEmail = async (email: string, resetUrl: string, username?: string) => {
    return sendEmail('password-reset', email, {
      username: username || 'Investidor',
      resetUrl,
      expiresIn: '1 hora'
    });
  };

  const sendPlanUpgradeEmail = async (
    email: string, 
    planName: string, 
    planFeatures?: string[],
    username?: string
  ) => {
    return sendEmail('plan-upgrade', email, {
      username: username || 'Investidor',
      planName,
      planFeatures: planFeatures || [
        'Análises avançadas de portfólio',
        'Alertas de preço personalizados',
        'Relatórios detalhados mensais',
        'Suporte prioritário'
      ],
      dashboardUrl: window.location.origin
    });
  };

  const sendSuspiciousLoginEmail = async (
    email: string, 
    loginDetails: LoginDetails,
    username?: string
  ) => {
    return sendEmail('suspicious-login', email, {
      username: username || 'Investidor',
      device: loginDetails.device,
      location: loginDetails.location,
      ip: loginDetails.ip,
      time: loginDetails.time,
      secureAccountUrl: `${window.location.origin}/auth`
    });
  };

  const sendMonthlyReportEmail = async (
    email: string, 
    reportData: MonthlyReportData,
    username?: string
  ) => {
    return sendEmail('monthly-report', email, {
      username: username || 'Investidor',
      ...reportData,
      dashboardUrl: window.location.origin
    });
  };

  return {
    sendEmail,
    sendWelcomeEmail,
    sendEmailConfirmation,
    sendPasswordResetEmail,
    sendPlanUpgradeEmail,
    sendSuspiciousLoginEmail,
    sendMonthlyReportEmail
  };
};