-- Create a table to store store settings including open/closed status
CREATE TABLE public.configuracoes_loja (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loja_aberta BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.configuracoes_loja ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read the store status (needed to check if store is open)
CREATE POLICY "Anyone can view store settings" 
ON public.configuracoes_loja 
FOR SELECT 
USING (true);

-- Only admins can update store settings
CREATE POLICY "Admins can update store settings" 
ON public.configuracoes_loja 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.configuracoes_loja (loja_aberta) VALUES (true);