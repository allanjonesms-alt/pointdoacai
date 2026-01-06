-- Create enum for adicional types
CREATE TYPE public.tipo_adicional AS ENUM ('frutas', 'doces', 'cereais');

-- Add tipo column to adicionais table
ALTER TABLE public.adicionais 
ADD COLUMN tipo tipo_adicional NOT NULL DEFAULT 'doces';