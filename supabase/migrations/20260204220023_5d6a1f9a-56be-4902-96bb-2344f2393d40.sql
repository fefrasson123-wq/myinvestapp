-- Adiciona coluna dividends para armazenar valor mensal de aluguel/dividendos
ALTER TABLE public.investments 
ADD COLUMN dividends numeric DEFAULT NULL;

-- Adiciona comentário explicativo
COMMENT ON COLUMN public.investments.dividends IS 'Monthly dividend/rent amount for the investment';