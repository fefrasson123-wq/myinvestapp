
-- Table to store purchases from Cakto for users who haven't registered yet
CREATE TABLE public.pending_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  plan_name text NOT NULL DEFAULT 'pro',
  customer_name text,
  cakto_subscription_id text,
  cakto_transaction_id text,
  payload jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

-- Index for fast email lookup
CREATE INDEX idx_pending_purchases_email ON public.pending_purchases (email);
CREATE INDEX idx_pending_purchases_status ON public.pending_purchases (status);

-- RLS - only service role / admins can manage
ALTER TABLE public.pending_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem gerenciar compras pendentes"
ON public.pending_purchases
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Function to activate pending purchases when a new user registers
CREATE OR REPLACE FUNCTION public.activate_pending_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pending RECORD;
  target_plan RECORD;
BEGIN
  -- Check for pending purchases matching the new user's email
  SELECT * INTO pending
  FROM public.pending_purchases
  WHERE email = LOWER(NEW.email)
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    -- Find the plan
    SELECT id INTO target_plan
    FROM public.plans
    WHERE name = pending.plan_name
    LIMIT 1;

    IF target_plan IS NOT NULL THEN
      -- Create subscription for the new user
      INSERT INTO public.user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end, cakto_subscription_id, cakto_customer_id)
      VALUES (
        NEW.id,
        target_plan.id,
        'active',
        now(),
        now() + interval '30 days',
        pending.cakto_subscription_id,
        pending.email
      );

      -- Mark pending purchase as processed
      UPDATE public.pending_purchases
      SET status = 'processed', processed_at = now()
      WHERE id = pending.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on auth.users to activate pending purchases on registration
CREATE TRIGGER on_auth_user_created_activate_purchase
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.activate_pending_purchase();
