-- Update handle_new_user function to include whatsapp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, whatsapp)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'username',
    COALESCE(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'whatsapp'
  );
  RETURN new;
END;
$function$