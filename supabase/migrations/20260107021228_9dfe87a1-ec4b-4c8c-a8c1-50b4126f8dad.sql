-- Add columns for free adicionals and extra adicional price
ALTER TABLE public.produtos 
ADD COLUMN adicionais_gratis integer NOT NULL DEFAULT 0,
ADD COLUMN preco_adicional_extra numeric NOT NULL DEFAULT 0;

-- Update Barca Pequena product if it exists
UPDATE public.produtos 
SET adicionais_gratis = 5, preco_adicional_extra = 2 
WHERE nome ILIKE '%barca%' AND tamanho = 'pequeno';