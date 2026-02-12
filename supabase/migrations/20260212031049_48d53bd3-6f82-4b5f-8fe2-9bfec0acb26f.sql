
-- Add max_categories column to plans
ALTER TABLE public.plans ADD COLUMN max_categories integer NOT NULL DEFAULT -1;

-- Update Free plan: 5 assets, 2 categories
UPDATE public.plans 
SET max_assets = 5, 
    max_categories = 2,
    features = '["Cadastro de até 5 ativos", "Até 2 categorias diferentes", "Definir metas pessoais"]'::jsonb,
    display_name = 'Gratuito'
WHERE name = 'free';

-- Update Pro plan: unlimited assets, unlimited categories
UPDATE public.plans 
SET max_assets = -1, 
    max_categories = -1,
    price = 29.90,
    features = '["Tudo do Gratuito", "Ativos ilimitados", "Categorias ilimitadas", "Visualização em Real ou Dólar", "Comparação com benchmarks", "Gráficos de evolução e rentabilidade", "Renda passiva e rendimentos", "Observações nos investimentos", "Tags de classificação", "Alocação e rebalanceamento"]'::jsonb,
    display_name = 'Pro'
WHERE name = 'pro';

-- Update Premium plan: everything from Pro
UPDATE public.plans 
SET max_assets = -1, 
    max_categories = -1,
    price = 49.90,
    features = '["Tudo do Pro liberado", "Suporte prioritário", "Acesso antecipado a novidades"]'::jsonb,
    display_name = 'Premium'
WHERE name = 'premium';
