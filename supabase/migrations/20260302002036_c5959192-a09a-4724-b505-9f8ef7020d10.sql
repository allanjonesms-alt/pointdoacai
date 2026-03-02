ALTER TABLE public.configuracoes_loja 
ADD COLUMN print_largura integer NOT NULL DEFAULT 80,
ADD COLUMN print_altura integer NOT NULL DEFAULT 0,
ADD COLUMN print_fonte_tamanho integer NOT NULL DEFAULT 12,
ADD COLUMN print_fonte_tipo text NOT NULL DEFAULT 'Arial';