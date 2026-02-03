-- Adicionar coluna goal_type à tabela personal_goals
ALTER TABLE public.personal_goals 
ADD COLUMN goal_type text NOT NULL DEFAULT 'value_goal';

-- Comentário descritivo
COMMENT ON COLUMN public.personal_goals.goal_type IS 'Tipo de meta: value_goal, buy_car, financial_independence, passive_income';