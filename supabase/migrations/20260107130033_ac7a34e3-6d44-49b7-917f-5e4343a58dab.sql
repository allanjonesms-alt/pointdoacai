-- Create table for registered streets
CREATE TABLE public.ruas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ruas ENABLE ROW LEVEL SECURITY;

-- Anyone can view active streets
CREATE POLICY "Anyone can view active streets"
ON public.ruas
FOR SELECT
USING (ativo = true);

-- Admins can manage streets
CREATE POLICY "Admins can manage streets"
ON public.ruas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert the streets
INSERT INTO public.ruas (nome) VALUES
  ('Av Darlindo José Carneiro'),
  ('Av Virgílio José Carneiro'),
  ('Av Olegário Barbosa da Silveira'),
  ('Av Lino Domingos de Oliveira'),
  ('Av Adolfo Alves Carneiro'),
  ('Av Averaldo Fernandes Barbosa'),
  ('Rua Jorge Martins da Silva'),
  ('Rua Joaquim Abadio Carneiro'),
  ('Rua Maria Galdino Flavio'),
  ('Rua Pio Martins de Almeida'),
  ('Rua Teodora de Freitas'),
  ('Rua Frei Gilberto José Motter'),
  ('Rua João Abadio de Oliveira'),
  ('Rua Pedro Mendes de Oliveira'),
  ('Rua Valdeci de Oliveira de Souza'),
  ('Rua Erasmo de Oliveira');