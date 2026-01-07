-- Create table for multiple delivery addresses
CREATE TABLE public.enderecos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rua TEXT NOT NULL DEFAULT '',
  numero TEXT NOT NULL DEFAULT '',
  bairro TEXT NOT NULL DEFAULT '',
  complemento TEXT,
  referencia TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enderecos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own addresses"
ON public.enderecos
FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own addresses"
ON public.enderecos
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own addresses"
ON public.enderecos
FOR UPDATE
USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own addresses"
ON public.enderecos
FOR DELETE
USING (auth.uid() = profile_id);

CREATE POLICY "Admins can view all addresses"
ON public.enderecos
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all addresses"
ON public.enderecos
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_enderecos_updated_at
BEFORE UPDATE ON public.enderecos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one default address per profile
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.enderecos
    SET is_default = false
    WHERE profile_id = NEW.profile_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_default_address_trigger
BEFORE INSERT OR UPDATE ON public.enderecos
FOR EACH ROW
EXECUTE FUNCTION public.ensure_single_default_address();