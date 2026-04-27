ALTER TABLE public.configuracoes_loja 
ADD COLUMN IF NOT EXISTS override_manual_em timestamp with time zone,
ADD COLUMN IF NOT EXISTS override_manual_status boolean;