-- Create a table for tracking dividend/income payments
CREATE TABLE public.income_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE,
  investment_name TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dividend', 'rent', 'interest', 'jcp')),
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL,
  ex_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.income_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own income payments" 
ON public.income_payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own income payments" 
ON public.income_payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own income payments" 
ON public.income_payments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own income payments" 
ON public.income_payments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_income_payments_updated_at
BEFORE UPDATE ON public.income_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_income_payments_user_id ON public.income_payments(user_id);
CREATE INDEX idx_income_payments_payment_date ON public.income_payments(payment_date);
CREATE INDEX idx_income_payments_type ON public.income_payments(type);