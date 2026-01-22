-- Add UPDATE policy for transactions table
CREATE POLICY "Usuários podem atualizar suas próprias transações"
ON public.transactions FOR UPDATE
USING (auth.uid() = user_id);

-- Add DELETE policy for transactions table
CREATE POLICY "Usuários podem deletar suas próprias transações"
ON public.transactions FOR DELETE
USING (auth.uid() = user_id);