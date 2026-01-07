-- Create enum for product categories
CREATE TYPE categoria_produto AS ENUM ('acai', 'barcas', 'sorvetes', 'picoles', 'bebidas');

-- Add category column to produtos table
ALTER TABLE public.produtos 
ADD COLUMN categoria categoria_produto NOT NULL DEFAULT 'acai';

-- Update all existing products to 'acai' category
UPDATE public.produtos SET categoria = 'acai';