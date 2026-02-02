-- Tabela para armazenar alocação ideal por categoria
CREATE TABLE public.portfolio_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  target_percent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category)
);

-- Enable RLS
ALTER TABLE public.portfolio_allocations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Usuários podem ver suas próprias alocações"
ON public.portfolio_allocations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias alocações"
ON public.portfolio_allocations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias alocações"
ON public.portfolio_allocations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias alocações"
ON public.portfolio_allocations
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_portfolio_allocations_updated_at
BEFORE UPDATE ON public.portfolio_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();