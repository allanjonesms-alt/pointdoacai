-- Add columns for dynamic schedule configuration
ALTER TABLE public.configuracoes_loja
ADD COLUMN horario_abertura TIME NOT NULL DEFAULT '13:30:00',
ADD COLUMN horario_fechamento TIME NOT NULL DEFAULT '22:00:00',
ADD COLUMN dias_funcionamento JSONB NOT NULL DEFAULT '["domingo", "segunda", "terca", "quarta", "sexta", "sabado"]'::jsonb;