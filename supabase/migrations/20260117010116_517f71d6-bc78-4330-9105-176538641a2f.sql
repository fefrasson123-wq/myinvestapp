-- Add whatsapp field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Update admin-list-users to include whatsapp (already works via profiles table)