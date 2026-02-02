-- Tabela de planos disponíveis
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  max_assets integer NOT NULL DEFAULT 5,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de assinaturas dos usuários
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_id uuid REFERENCES public.plans(id) NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'pending')),
  cakto_subscription_id text,
  cakto_customer_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  canceled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para plans (todos podem ver planos ativos)
CREATE POLICY "Todos podem ver planos ativos"
ON public.plans FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins podem gerenciar planos"
ON public.plans FOR ALL
USING (is_admin());

-- Políticas para user_subscriptions
CREATE POLICY "Usuários podem ver sua própria assinatura"
ON public.user_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todas assinaturas"
ON public.user_subscriptions FOR SELECT
USING (is_admin());

CREATE POLICY "Sistema pode gerenciar assinaturas"
ON public.user_subscriptions FOR ALL
USING (is_admin());

-- Trigger para updated_at
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir planos padrão
INSERT INTO public.plans (name, display_name, price, max_assets, features) VALUES
('free', 'Gratuito', 0, 5, '["Até 5 ativos", "Gráficos básicos", "Histórico 30 dias"]'::jsonb),
('pro', 'Pro', 29.90, 50, '["Até 50 ativos", "Gráficos avançados", "Histórico completo", "Relatórios mensais"]'::jsonb),
('premium', 'Premium', 49.90, -1, '["Ativos ilimitados", "Todos os recursos Pro", "Suporte prioritário", "API access"]'::jsonb);

-- Função para verificar limite de ativos
CREATE OR REPLACE FUNCTION public.get_user_asset_limit(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.max_assets 
     FROM user_subscriptions us 
     JOIN plans p ON p.id = us.plan_id 
     WHERE us.user_id = p_user_id 
       AND us.status = 'active'),
    5
  )
$$;

-- Função para verificar se pode adicionar ativo
CREATE OR REPLACE FUNCTION public.can_add_asset(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN get_user_asset_limit(p_user_id) = -1 THEN true
      ELSE (SELECT COUNT(*) FROM investments WHERE user_id = p_user_id) < get_user_asset_limit(p_user_id)
    END
$$;