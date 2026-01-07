-- Create bairros table
CREATE TABLE public.bairros (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bairros ENABLE ROW LEVEL SECURITY;

-- Admins can manage bairros
CREATE POLICY "Admins can manage bairros"
ON public.bairros
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active bairros
CREATE POLICY "Anyone can view active bairros"
ON public.bairros
FOR SELECT
USING (ativo = true);

-- Insert initial bairros
INSERT INTO public.bairros (nome) VALUES
  ('Centro'),
  ('Jd Bom Sucesso'),
  ('Pôr do Sol'),
  ('Nascer do Sol'),
  ('Cohab I'),
  ('Cohab II'),
  ('Cohab III');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bairros;