import { supabase } from '@/integrations/supabase/client';

type EmailType = 'welcome' | 'plan-upgrade' | 'password-reset';

interface EmailData {
  username?: string;
  loginUrl?: string;
  planName?: string;
  planFeatures?: string[];
  dashboardUrl?: string;
  resetUrl?: string;
  expiresIn?: string;
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

  const sendPasswordResetEmail = async (email: string, resetUrl: string, username?: string) => {
    return sendEmail('password-reset', email, {
      username: username || 'Investidor',
      resetUrl,
      expiresIn: '1 hora'
    });
  };

  return {
    sendEmail,
    sendWelcomeEmail,
    sendPlanUpgradeEmail,
    sendPasswordResetEmail
  };
};
