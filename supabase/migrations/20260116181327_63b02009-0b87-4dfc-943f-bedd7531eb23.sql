-- Fix the foreign key to cascade delete tags when investment is deleted
ALTER TABLE public.investment_tags 
DROP CONSTRAINT IF EXISTS investment_tags_investment_id_fkey;

ALTER TABLE public.investment_tags 
ADD CONSTRAINT investment_tags_investment_id_fkey 
FOREIGN KEY (investment_id) 
REFERENCES public.investments(id) 
ON DELETE CASCADE;

-- Also fix transactions to set investment_id to NULL when investment is deleted
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_investment_id_fkey;

ALTER TABLE public.transactions
ADD CONSTRAINT transactions_investment_id_fkey
FOREIGN KEY (investment_id)
REFERENCES public.investments(id)
ON DELETE SET NULL;