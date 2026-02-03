-- Remover política permissiva de INSERT
DROP POLICY "Sistema pode criar notificações" ON public.notifications;

-- Criar política mais restritiva: apenas service role pode inserir (via edge function)
-- E usuários podem criar suas próprias notificações manualmente se necessário
CREATE POLICY "Service role ou próprio usuário pode criar notificações"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');